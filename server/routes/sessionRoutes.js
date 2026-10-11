
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getMySessions,
  getSessionById,
  createSessionRequest,
  acceptSessionRequest,
  rejectSessionRequest,
  completeSession,
  cancelSession,
  rescheduleSession,
} = require("../controllers/sessionController");

router.get("/", protect, getMySessions);
router.get("/:id", protect, getSessionById);

router.post("/request", protect, createSessionRequest);

router.patch("/:id/accept", protect, acceptSessionRequest);
router.patch("/:id/reject", protect, rejectSessionRequest);
router.patch("/:id/complete", protect, completeSession);
router.patch("/:id/cancel", protect, cancelSession);
router.patch("/:id/reschedule", protect, rescheduleSession);

module.exports = router;
