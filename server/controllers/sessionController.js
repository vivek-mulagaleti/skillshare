
const mongoose = require("mongoose");

const Session = require("../models/Session");
const User = require("../models/User");
const Skill = require("../models/Skill");
const UserSkill = require("../models/UserSkill");
const createNotification = require("../utils/notificationHelper");

const getCurrentUserId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

const isValidId = (id) => mongoose.isValidObjectId(id);

const populateSessionQuery = (query) =>
  query
    .populate("teacher", "name avatar email timeCredits")
    .populate("learner", "name avatar email timeCredits")
    .populate("skill", "name category description");

const getPopulatedSession = (id) =>
  populateSessionQuery(Session.findById(id));

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });


const getRelatedUserId = (value) => {
  if (!value) return null;

  // Handle populated user documents and plain ObjectIds.
  return String(value._id || value);
};

const isParticipant = (session, userId) =>
  getRelatedUserId(session.teacher) === String(userId) ||
  getRelatedUserId(session.learner) === String(userId);


  
const parseMeetingUrl = (value) => {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 2048
  ) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    const isGoogleMeet = hostname === "meet.google.com";

    const isZoom =
      hostname === "zoom.us" ||
      hostname.endsWith(".zoom.us");

    const isMicrosoftTeams =
      hostname === "teams.microsoft.com" ||
      hostname.endsWith(".teams.microsoft.com") ||
      hostname === "teams.live.com" ||
      hostname.endsWith(".teams.live.com");

    const isSupportedMeetingPlatform =
      url.protocol === "https:" &&
      (isGoogleMeet || isZoom || isMicrosoftTeams);

    if (!isSupportedMeetingPlatform) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
};


const parseFutureDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null;
  }

  return date;
};

// GET /api/sessions
const getMySessions = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    const sessions = await populateSessionQuery(
      Session.find({
        $or: [{ learner: userId }, { teacher: userId }],
      }).sort({ createdAt: -1 })
    );

    return res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions/:id
const getSessionById = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId || !isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    const session = await getPopulatedSession(req.params.id);

    if (!session) {
      return sendError(res, 404, "Session not found.");
    }

    if (
      !isParticipant(session, userId) &&
      req.user?.role !== "admin"
    ) {
      return sendError(res, 403, "Not authorized to view this session.");
    }

    return res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// POST /api/sessions/request
const createSessionRequest = async (req, res, next) => {
  try {
    const learnerId = getCurrentUserId(req);
    const { teacherId, skillId, duration = 1, message = "", notes = "" } =
      req.body || {};

    if (!learnerId || !isValidId(learnerId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(teacherId) || !isValidId(skillId)) {
      return sendError(
        res,
        400,
        "Valid teacher ID and skill ID are required."
      );
    }

    if (String(learnerId) === String(teacherId)) {
      return sendError(res, 400, "You cannot request a session with yourself.");
    }

    const hours = Number(duration);

    if (!Number.isInteger(hours) || hours < 1 || hours > 4) {
      return sendError(
        res,
        400,
        "Session duration must be between 1 and 4 whole hours."
      );
    }

    if (typeof message !== "string" || typeof notes !== "string") {
      return sendError(res, 400, "Message must be text.");
    }

    const [learner, teacher, skill, teachingSkill] = await Promise.all([
      User.findById(learnerId),
      User.findById(teacherId),
      Skill.findById(skillId),
      UserSkill.findOne({
        user: teacherId,
        skill: skillId,
        type: "TEACH",
      }),
    ]);

    if (!learner) {
      return sendError(res, 404, "Learner account not found.");
    }

    if (!teacher) {
      return sendError(res, 404, "Teacher account not found.");
    }

    if (!skill) {
      return sendError(res, 404, "Skill not found.");
    }

    if (!teachingSkill) {
      return sendError(
        res,
        400,
        "This user does not teach the selected skill."
      );
    }

    if (learner.timeCredits < hours) {
      return sendError(
        res,
        400,
        `You need ${hours} credit(s), but you have ${learner.timeCredits}.`
      );
    }

    const existingPending = await Session.findOne({
      learner: learnerId,
      teacher: teacherId,
      skill: skillId,
      status: "PENDING",
    });

    if (existingPending) {
      return sendError(
        res,
        409,
        "You already have a pending request for this skill with this teacher."
      );
    }

    const session = await Session.create({
      learner: learnerId,
      teacher: teacherId,
      skill: skillId,
      duration: hours,
      credits: hours,
      message: (message || notes).trim().slice(0, 500),
      status: "PENDING",
      creditsReserved: false,
      creditsRefunded: false,
    });

    await createNotification({
      recipient: teacherId,
      actor: learnerId,
      type: "SESSION_REQUEST",
      title: "New session request",
      message: `${learner.name || "A learner"} requested a session for ${skill.name}.`,
      session: session._id,
    });

    return res.status(201).json({
      success: true,
      message: "Session request sent successfully.",
      session: await getPopulatedSession(session._id),
    });
  } catch (error) {
  // The unique partial index prevents concurrent duplicate requests.
  if (
    error.code === 11000 &&
    error.keyPattern?.learner &&
    error.keyPattern?.teacher &&
    error.keyPattern?.skill
  ) {
    return sendError(
      res,
      409,
      "You already have a pending request for this skill with this teacher."
    );
  }

  return next(error);
}
};

// PATCH /api/sessions/:id/accept

const acceptSessionRequest = async (req, res, next) => {
  let dbSession;

  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const { meetingLink, scheduledAt } = req.body || {};

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    const parsedLink = parseMeetingUrl(meetingLink);
    const meetingDate = parseFutureDate(scheduledAt);

    if (!parsedLink) {
      return sendError(
        res,
        400,
        "A valid HTTPS meeting link is required."
      );
    }

    if (!meetingDate) {
      return sendError(
        res,
        400,
        "Please select a valid meeting date and time in the future."
      );
    }

    dbSession = await mongoose.startSession();

    let accepted;

    await dbSession.withTransaction(async () => {
      // Read the session inside the transaction.
      const session = await Session.findById(id).session(dbSession);

      if (!session) {
        const error = new Error("Session request not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(session.teacher) !== String(userId)) {
        const error = new Error(
          "Only the teacher can accept this request."
        );
        error.statusCode = 403;
        throw error;
      }

      if (
        session.status !== "PENDING" ||
        session.creditsReserved ||
        session.creditsRefunded
      ) {
        const error = new Error(
          "Only pending requests without reserved or refunded credits can be accepted."
        );
        error.statusCode = 409;
        throw error;
      }

      // Deduct credits only if the learner has enough.
      const learner = await User.findOneAndUpdate(
        {
          _id: session.learner,
          timeCredits: { $gte: session.credits },
        },
        {
          $inc: { timeCredits: -session.credits },
        },
        {
          new: true,
          session: dbSession,
        }
      );

      if (!learner) {
        const error = new Error(
          "The learner does not have enough time credits."
        );
        error.statusCode = 400;
        throw error;
      }

      // Update the session in the same transaction.
      accepted = await Session.findOneAndUpdate(
        {
          _id: id,
          teacher: userId,
          status: "PENDING",
          creditsReserved: false,
          creditsRefunded: false,
        },
        {
          $set: {
            status: "ACCEPTED",
            creditsReserved: true,
            creditsRefunded: false,
            meetingLink: parsedLink,
            scheduledAt: meetingDate,
          },
        },
        {
          new: true,
          runValidators: true,
          session: dbSession,
        }
      );

      if (!accepted) {
        const error = new Error(
          "This request was already processed. Please refresh."
        );
        error.statusCode = 409;
        throw error;
      }
    });

    // Notifications happen only after the transaction commits.
    await createNotification({
      recipient: accepted.learner,
      actor: userId,
      type: "SESSION_ACCEPTED",
      title: "Session request accepted",
      message:
        "Your session request was accepted and a meeting has been scheduled.",
      session: accepted._id,
    });

    return res.json({
      success: true,
      message: "Session accepted and meeting scheduled successfully.",
      session: await getPopulatedSession(accepted._id),
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return next(error);
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
};


// PATCH /api/sessions/:id/reschedule

const rescheduleSession = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const { meetingLink, scheduledAt } = req.body || {};

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    const parsedLink = parseMeetingUrl(meetingLink);
    const meetingDate = parseFutureDate(scheduledAt);

    if (!parsedLink) {
      return sendError(
        res,
        400,
        "A valid HTTPS meeting link is required."
      );
    }

    if (!meetingDate) {
      return sendError(
        res,
        400,
        "Please select a valid meeting date and time in the future."
      );
    }

    // Update only if this is still an accepted session
    // belonging to this teacher, with credits reserved.
    const rescheduled = await Session.findOneAndUpdate(
      {
        _id: id,
        teacher: userId,
        status: "ACCEPTED",
        creditsReserved: true,
        creditsRefunded: false,
      },
      {
        $set: {
          meetingLink: parsedLink,
          scheduledAt: meetingDate,
          teacherConfirmedAt: null,
          learnerConfirmedAt: null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!rescheduled) {
      const existing = await Session.findById(id);

      if (!existing) {
        return sendError(res, 404, "Session not found.");
      }

      if (String(existing.teacher) !== String(userId)) {
        return sendError(
          res,
          403,
          "Only the assigned teacher can reschedule this session."
        );
      }

      return sendError(
        res,
        409,
        "This session can no longer be rescheduled."
      );
    }

    await createNotification({
      recipient: rescheduled.learner,
      actor: userId,
      type: "SESSION_RESCHEDULED",
      title: "Session rescheduled",
      message: "Your teacher has changed the session date or meeting link.",
      session: rescheduled._id,
    });

    return res.json({
      success: true,
      message: "Session rescheduled successfully.",
      session: await getPopulatedSession(rescheduled._id),
    });
  } catch (error) {
    return next(error);
  }
};


// PATCH /api/sessions/:id/reject

const rejectSessionRequest = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    // Atomically reject only a pending request owned by this teacher.
    const rejected = await Session.findOneAndUpdate(
      {
        _id: id,
        teacher: userId,
        status: "PENDING",
        creditsReserved: false,
        creditsRefunded: false,
      },
      {
        $set: {
          status: "REJECTED",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!rejected) {
      const existing = await Session.findById(id);

      if (!existing) {
        return sendError(res, 404, "Session request not found.");
      }

      if (String(existing.teacher) !== String(userId)) {
        return sendError(
          res,
          403,
          "Only the teacher can reject this request."
        );
      }

      return sendError(
        res,
        409,
        "Only pending requests without reserved credits can be rejected."
      );
    }

    await createNotification({
      recipient: rejected.learner,
      actor: userId,
      type: "SESSION_REJECTED",
      title: "Session request declined",
      message: "Your session request was rejected by the teacher.",
      session: rejected._id,
    });

    return res.json({
      success: true,
      message: "Session request rejected.",
      session: await getPopulatedSession(rejected._id),
    });
  } catch (error) {
    return next(error);
  }
};


// PATCH /api/sessions/:id/complete

const completeSession = async (req, res, next) => {
  let dbSession;

  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    dbSession = await mongoose.startSession();

    let result;
    let newlyCompleted = false;

    await dbSession.withTransaction(async () => {
      const current = await Session.findById(id).session(dbSession);

      if (!current) {
        const error = new Error("Session not found.");
        error.statusCode = 404;
        throw error;
      }

      const isTeacher = String(current.teacher) === String(userId);
      const isLearner = String(current.learner) === String(userId);

      if (!isTeacher && !isLearner) {
        const error = new Error(
          "Only session participants can confirm completion."
        );
        error.statusCode = 403;
        throw error;
      }

      if (current.status === "COMPLETED") {
        result = "COMPLETED";
        return;
      }

      if (current.status !== "ACCEPTED") {
        const error = new Error(
          "Only accepted sessions can be completed."
        );
        error.statusCode = 409;
        throw error;
      }

      if (!current.creditsReserved || current.creditsRefunded) {
        const error = new Error(
          "Session credits are not properly reserved."
        );
        error.statusCode = 409;
        throw error;
      }

      // Record this participant's confirmation inside the transaction.
      const confirmationField = isTeacher
        ? "teacherConfirmedAt"
        : "learnerConfirmedAt";

      if (!current[confirmationField]) {
        current[confirmationField] = new Date();
        await current.save({ session: dbSession });
      }

      // Both participants must confirm before the payout.
      if (
        !current.teacherConfirmedAt ||
        !current.learnerConfirmedAt
      ) {
        result = isTeacher ? "TEACHER_CONFIRMED" : "LEARNER_CONFIRMED";
        return;
      }

      // Change the session to COMPLETED within the same transaction.
      // Only this transition can issue the teacher's payout.
      const completion = await Session.findOneAndUpdate(
        {
          _id: id,
          status: "ACCEPTED",
          creditsReserved: true,
          creditsRefunded: false,
          teacherConfirmedAt: { $ne: null },
          learnerConfirmedAt: { $ne: null },
        },
        {
          $set: {
            status: "COMPLETED",
            completedAt: new Date(),
            creditsReserved: false,
          },
        },
        {
          new: true,
          runValidators: true,
          session: dbSession,
        }
      );

      if (!completion) {
        const error = new Error(
          "Session changed while completing. Please refresh."
        );
        error.statusCode = 409;
        throw error;
      }

      // Pay the teacher only after the guarded status transition.
      const teacher = await User.findByIdAndUpdate(
        completion.teacher,
        { $inc: { timeCredits: completion.credits } },
        { new: true, session: dbSession }
      );

      if (!teacher) {
        const error = new Error("Teacher account not found.");
        error.statusCode = 409;
        throw error;
      }

      newlyCompleted = true;
      result = "COMPLETED";
    });

    // Notify only after the transaction has committed.
    if (newlyCompleted) {
      const completed = await Session.findById(id);

      await Promise.all([
        createNotification({
          recipient: completed.learner,
          actor: userId,
          type: "SESSION_COMPLETED",
          title: "Session completed",
          message: "Your learning session has been completed successfully.",
          session: id,
        }),
        createNotification({
          recipient: completed.teacher,
          actor: userId,
          type: "SESSION_COMPLETED",
          title: "Session completed",
          message: "Your teaching session has been completed successfully.",
          session: id,
        }),
      ]);
    }

    const updatedSession = await getPopulatedSession(id);

    if (result === "COMPLETED") {
      return res.json({
        success: true,
        message: newlyCompleted
          ? "Session completed and credits transferred."
          : "Session is already completed.",
        session: updatedSession,
      });
    }

    return res.json({
      success: true,
      message:
        result === "TEACHER_CONFIRMED"
          ? "Teacher confirmation saved. Waiting for learner confirmation."
          : "Learner confirmation saved. Waiting for teacher confirmation.",
      session: updatedSession,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return next(error);
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
};


// PATCH /api/sessions/:id/cancel

const cancelSession = async (req, res, next) => {
  let dbSession;

  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const { reason = "" } = req.body || {};

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    if (typeof reason !== "string" || reason.length > 500) {
      return sendError(
        res,
        400,
        "Cancellation reason must be text of at most 500 characters."
      );
    }

    dbSession = await mongoose.startSession();

    let cancelled;
    let shouldRefund = false;
    let isAdmin = false;

    await dbSession.withTransaction(async () => {
      const current = await Session.findById(id).session(dbSession);

      if (!current) {
        const error = new Error("Session not found.");
        error.statusCode = 404;
        throw error;
      }

      const isTeacher = String(current.teacher) === String(userId);
      const isLearner = String(current.learner) === String(userId);
      isAdmin = !isTeacher && !isLearner && req.user?.role === "admin";

      if (!isTeacher && !isLearner && !isAdmin) {
        const error = new Error(
          "Not authorized to cancel this session."
        );
        error.statusCode = 403;
        throw error;
      }

      if (
        ["COMPLETED", "CANCELLED", "REJECTED"].includes(current.status)
      ) {
        const error = new Error("This session cannot be cancelled.");
        error.statusCode = 409;
        throw error;
      }

      shouldRefund =
        current.status === "ACCEPTED" &&
        current.creditsReserved === true &&
        current.creditsRefunded === false;

      // Refund and cancellation are committed or rolled back together.
      if (shouldRefund) {
        const learner = await User.findById(current.learner)
          .session(dbSession);

        if (!learner) {
          const error = new Error(
            "Learner account not found; refund could not be made."
          );
          error.statusCode = 409;
          throw error;
        }

        learner.timeCredits += current.credits;
        await learner.save({ session: dbSession });

        current.creditsReserved = false;
        current.creditsRefunded = true;
      }

      current.status = "CANCELLED";
      current.cancelledAt = new Date();
      current.cancelledBy = userId;
      current.cancellationReason = reason.trim();

      await current.save({ session: dbSession });
      cancelled = current;
    });

    // Send notifications only after the transaction commits.
    const isTeacher = String(cancelled.teacher) === String(userId);
    const isLearner = String(cancelled.learner) === String(userId);

    const recipients =
      isAdmin
        ? [cancelled.learner, cancelled.teacher]
        : [isTeacher ? cancelled.learner : cancelled.teacher];

    await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          recipient,
          actor: userId,
          type: "SESSION_CANCELLED",
          title: "Session cancelled",
          message: shouldRefund
            ? "A session was cancelled. The learner's reserved credits have been refunded."
            : "Your session has been cancelled.",
          session: cancelled._id,
        })
      )
    );

    return res.json({
      success: true,
      message: shouldRefund
        ? "Session cancelled and learner credits refunded."
        : "Session cancelled successfully.",
      session: await getPopulatedSession(cancelled._id),
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return next(error);
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
};


module.exports = {
  getMySessions,
  getSessionById,
  createSessionRequest,
  acceptSessionRequest,
  rejectSessionRequest,
  completeSession,
  cancelSession,
  rescheduleSession,
};
