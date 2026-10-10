const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getUserById,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.put("/me", protect, updateMyProfile);

router.get("/:id", protect, getUserById);

module.exports = router;