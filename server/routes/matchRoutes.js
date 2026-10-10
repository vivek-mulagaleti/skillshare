const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  findLearningMatches,
} = require("../controllers/matchController");

const router = express.Router();

router.get("/learn", protect, findLearningMatches);

module.exports = router;