const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  addUserSkill,
  getMySkills,
} = require("../controllers/userSkillController");

const router = express.Router();

router.get("/my-skills", protect, getMySkills);

router.post("/", protect, addUserSkill);

module.exports = router;