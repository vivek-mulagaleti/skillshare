
const express = require("express");
const router = express.Router();

const {
  createSessionRequest,
  getMySessions,
  acceptSessionRequest,
  rejectSessionRequest,
  completeSession,
} = require("../controllers/sessionController");

const  protect  = require("../middleware/authMiddleware");

router.get("/", protect, getMySessions);
router.post("/request", protect, createSessionRequest);
router.patch("/:id/accept", protect, acceptSessionRequest);
router.patch("/:id/reject", protect, rejectSessionRequest);
router.patch("/:id/complete", protect, completeSession);

module.exports = router;
