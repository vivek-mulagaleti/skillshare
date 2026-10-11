
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createReview,
  getTeacherReviews,
  getMySessionReview,
} = require("../controllers/reviewController");

router.get("/teacher/:teacherId", getTeacherReviews);

router.get("/session/:sessionId/mine", protect, getMySessionReview);

router.post("/session/:sessionId", protect, createReview);

module.exports = router;
