const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createSkill,
  getSkills,
} = require("../controllers/skillController");

const router = express.Router();

router.get("/", getSkills);

router.post("/", protect, createSkill);

module.exports = router;