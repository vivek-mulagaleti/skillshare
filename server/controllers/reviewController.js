
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Session = require("../models/Session");

const getCurrentUserId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// POST /api/reviews/session/:sessionId
const createReview = async (req, res, next) => {
  try {
    const learnerId = getCurrentUserId(req);
    const { sessionId } = req.params;
    const { rating, comment = "" } = req.body || {};

    if (!learnerId || !mongoose.isValidObjectId(learnerId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!mongoose.isValidObjectId(sessionId)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    // Accept only a real integer, not strings or decimals.
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return sendError(res, 400, "Rating must be an integer from 1 to 5.");
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length > 1000
    ) {
      return sendError(
        res,
        400,
        "Review comment must be text of at most 1000 characters."
      );
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found.");
    }

    if (String(session.learner) !== String(learnerId)) {
      return sendError(
        res,
        403,
        "Only the learner who attended this session can review the teacher."
      );
    }

    if (session.status !== "COMPLETED") {
      return sendError(
        res,
        400,
        "You can review a session only after it is completed."
      );
    }

    const existingReview = await Review.findOne({ session: sessionId });

    if (existingReview) {
      return sendError(
        res,
        409,
        "You have already reviewed this session."
      );
    }

    // The unique session index in Review.js protects against
    // simultaneous submissions for the same session.
    const review = await Review.create({
      session: session._id,
      learner: session.learner,
      teacher: session.teacher,
      skill: session.skill,
      rating,
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id)
      .populate("learner", "name avatar")
      .populate("teacher", "name avatar")
      .populate("skill", "name");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "A review already exists for this session."
      );
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return sendError(res, 400, "Invalid review data.");
    }

    return next(error);
  }
};

// GET /api/reviews/teacher/:teacherId
const getTeacherReviews = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    if (!mongoose.isValidObjectId(teacherId)) {
      return sendError(res, 400, "Invalid teacher ID.");
    }

    const reviews = await Review.find({ teacher: teacherId })
      .populate("learner", "name avatar")
      .populate("skill", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews) *
              10
          ) / 10;

    return res.json({
      success: true,
      count: totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/reviews/session/:sessionId/mine
const getMySessionReview = async (req, res, next) => {
  try {
    const learnerId = getCurrentUserId(req);
    const { sessionId } = req.params;

    if (!learnerId || !mongoose.isValidObjectId(learnerId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!mongoose.isValidObjectId(sessionId)) {
      return sendError(res, 400, "Invalid session ID.");
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found.");
    }

    if (String(session.learner) !== String(learnerId)) {
      return sendError(
        res,
        403,
        "Only the learner can view their review for this session."
      );
    }

    const review = await Review.findOne({
      session: sessionId,
      learner: learnerId,
    })
      .populate("teacher", "name avatar")
      .populate("skill", "name");

    return res.json({
      success: true,
      review,
      canReview: session.status === "COMPLETED" && !review,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getTeacherReviews,
  getMySessionReview,
};
