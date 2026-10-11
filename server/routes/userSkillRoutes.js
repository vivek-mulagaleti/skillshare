
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  addUserSkill,
  getMySkills,
  getTeachingSkillsByUserId,
  updateUserSkill,
  deleteUserSkill,
} = require("../controllers/userSkillController");

const router = express.Router();

// Get the authenticated user's skills.
router.get("/my-skills", protect, getMySkills);

// Get another user's teaching skills.
router.get("/teacher/:userId", protect, getTeachingSkillsByUserId);

// Add a skill to the authenticated user's profile.
router.post("/", protect, addUserSkill);

// Update a skill in the authenticated user's profile.
router.put("/:userSkillId", protect, updateUserSkill);

// Delete a skill from the authenticated user's profile.
router.delete("/:userSkillId", protect, deleteUserSkill);

module.exports = router;
