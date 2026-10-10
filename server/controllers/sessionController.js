const Session = require("../models/Session");
const UserSkill = require("../models/UserSkill");
const User = require("../models/User");

const createSessionRequest = async (req, res) => {
  try {
    const {
      teacherId,
      skillId,
      duration,
      message,
    } = req.body;

    const learnerId = req.user.userId;

    // -----------------------------
    // Validate required fields
    // -----------------------------

    if (!teacherId || !skillId || !duration) {
      return res.status(400).json({
        message:
          "Teacher, skill and duration are required",
      });
    }

    // -----------------------------
    // Validate duration
    // -----------------------------

    const sessionDuration = Number(duration);

    if (
      !Number.isInteger(sessionDuration) ||
      sessionDuration < 1 ||
      sessionDuration > 4
    ) {
      return res.status(400).json({
        message:
          "Session duration must be between 1 and 4 hours",
      });
    }

    // -----------------------------
    // Prevent requesting yourself
    // -----------------------------

    if (learnerId === teacherId) {
      return res.status(400).json({
        message:
          "You cannot request a session with yourself",
      });
    }

    // -----------------------------
    // Check teacher exists
    // -----------------------------

    const teacher = await User.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    // -----------------------------
    // Check learner has enough credits
    // -----------------------------

    const learner = await User.findById(learnerId);

    if (!learner) {
      return res.status(404).json({
        message: "Learner not found",
      });
    }

    if (learner.timeCredits < sessionDuration) {
      return res.status(400).json({
        message:
          "You do not have enough time credits for this session",
      });
    }

    // -----------------------------
    // Verify teacher actually
    // teaches this skill
    // -----------------------------

    const teacherSkill = await UserSkill.findOne({
      user: teacherId,
      skill: skillId,
      type: "TEACH",
    });

    if (!teacherSkill) {
      return res.status(400).json({
        message:
          "This user does not teach the selected skill",
      });
    }

    // -----------------------------
    // Verify learner actually
    // wants to learn this skill
    // -----------------------------

    const learnerSkill = await UserSkill.findOne({
      user: learnerId,
      skill: skillId,
      type: "LEARN",
    });

    if (!learnerSkill) {
      return res.status(400).json({
        message:
          "You have not added this skill to your learning profile",
      });
    }

    // -----------------------------
    // Prevent duplicate pending request
    // -----------------------------

    const existingRequest = await Session.findOne({
      learner: learnerId,
      teacher: teacherId,
      skill: skillId,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(409).json({
        message:
          "You already have a pending request for this skill",
      });
    }

    // -----------------------------
    // Create request
    // -----------------------------

    const session = await Session.create({
      learner: learnerId,
      teacher: teacherId,
      skill: skillId,
      duration: sessionDuration,
      credits: sessionDuration,
      message: message || "",
      status: "PENDING",
    });

    const populatedSession = await Session.findById(
      session._id
    )
      .populate("learner", "name avatar")
      .populate("teacher", "name avatar")
      .populate("skill", "name category");

    res.status(201).json({
      message: "Session request sent successfully",
      session: populatedSession,
    });
  } catch (error) {
    console.error(
      "Create session request error:",
      error
    );

    res.status(500).json({
      message:
        "Server error while creating session request",
    });
  }
};



const getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessions = await Session.find({
      $or: [
        { learner: userId },
        { teacher: userId },
      ],
    })
      .populate("learner", "name avatar")
      .populate("teacher", "name avatar")
      .populate("skill", "name category")
      .sort({ createdAt: -1 });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);

    res.status(500).json({
      message: "Server error while fetching sessions",
    });
  }
};

const acceptSessionRequest = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session request not found",
      });
    }

    // Only the intended teacher can accept.
    if (session.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You cannot accept this request",
      });
    }

    if (session.status !== "PENDING") {
      return res.status(400).json({
        message: "This request is no longer pending",
      });
    }

    session.status = "ACCEPTED";
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate("learner", "name avatar")
      .populate("teacher", "name avatar")
      .populate("skill", "name category");

    res.status(200).json({
      message: "Session request accepted",
      session: populatedSession,
    });
  } catch (error) {
    console.error("Accept session error:", error);

    res.status(500).json({
      message: "Server error while accepting request",
    });
  }
};

const rejectSessionRequest = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session request not found",
      });
    }

    // Only the intended teacher can reject.
    if (session.teacher.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You cannot reject this request",
      });
    }

    if (session.status !== "PENDING") {
      return res.status(400).json({
        message: "This request is no longer pending",
      });
    }

    session.status = "REJECTED";
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate("learner", "name avatar")
      .populate("teacher", "name avatar")
      .populate("skill", "name category");

    res.status(200).json({
      message: "Session request rejected",
      session: populatedSession,
    });
  } catch (error) {
    console.error("Reject session error:", error);

    res.status(500).json({
      message: "Server error while rejecting request",
    });
  }
};



const completeSession = async (req, res) => {
  const mongoose = require("mongoose");
  const sessionId = req.params.id;
  const userId = req.user.userId;

  const dbSession = await mongoose.startSession();

  try {
    let completedSession;

    await dbSession.withTransaction(async () => {
      const session = await Session.findById(sessionId)
        .session(dbSession);

      if (!session) {
        const error = new Error("Session not found");
        error.statusCode = 404;
        throw error;
      }

      // Only the learner or teacher can complete the session.
      const isLearner = session.learner.toString() === userId;
      const isTeacher = session.teacher.toString() === userId;

      if (!isLearner && !isTeacher) {
        const error = new Error(
          "You are not authorized to complete this session"
        );
        error.statusCode = 403;
        throw error;
      }

      if (session.status !== "ACCEPTED") {
        const error = new Error(
          "Only accepted sessions can be completed"
        );
        error.statusCode = 400;
        throw error;
      }

      const learner = await User.findById(session.learner)
        .session(dbSession);

      const teacher = await User.findById(session.teacher)
        .session(dbSession);

      if (!learner || !teacher) {
        const error = new Error(
          "Learner or teacher account not found"
        );
        error.statusCode = 404;
        throw error;
      }

      const credits = session.credits;

      if (learner.timeCredits < credits) {
        const error = new Error(
          "The learner does not have enough time credits"
        );
        error.statusCode = 400;
        throw error;
      }

      learner.timeCredits -= credits;
      teacher.timeCredits += credits;

      await learner.save({ session: dbSession });
      await teacher.save({ session: dbSession });

      session.status = "COMPLETED";
      session.completedAt = new Date();

      await session.save({ session: dbSession });

      completedSession = session;
    });

    const populatedSession = await Session.findById(
      completedSession._id
    )
      .populate("learner", "name avatar timeCredits")
      .populate("teacher", "name avatar timeCredits")
      .populate("skill", "name category");

    return res.status(200).json({
      message: "Session completed and credits transferred successfully",
      session: populatedSession,
    });
  } catch (error) {
    console.error("Complete session error:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode
          ? error.message
          : "Server error while completing session",
    });
  } finally {
    await dbSession.endSession();
  }
};



module.exports = {
  createSessionRequest,
  getMySessions,
  acceptSessionRequest,
  rejectSessionRequest,
  completeSession,
};
