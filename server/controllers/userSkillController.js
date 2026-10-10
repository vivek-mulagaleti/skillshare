const UserSkill = require("../models/UserSkill");
const Skill = require("../models/Skill");

const addUserSkill = async (req, res) => {
  try {
    const { skillId, type, level, description } = req.body;

    if (!skillId || !type || !level) {
      return res.status(400).json({
        message: "Skill, type and level are required",
      });
    }

    if (!["TEACH", "LEARN"].includes(type)) {
      return res.status(400).json({
        message: "Type must be TEACH or LEARN",
      });
    }

    if (
      !["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(level)
    ) {
      return res.status(400).json({
        message: "Invalid skill level",
      });
    }

    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    const existingUserSkill = await UserSkill.findOne({
      user: req.user.userId,
      skill: skillId,
      type,
    });

    if (existingUserSkill) {
      return res.status(409).json({
        message: "You already have this skill",
      });
    }

    const userSkill = await UserSkill.create({
      user: req.user.userId,
      skill: skillId,
      type,
      level,
      description: description || "",
    });

    const populatedUserSkill = await UserSkill.findById(userSkill._id)
      .populate("skill", "name category description");

    res.status(201).json({
      message: "Skill added to your profile",
      userSkill: populatedUserSkill,
    });
  } catch (error) {
    console.error("Add user skill error:", error);

    res.status(500).json({
      message: "Server error while adding skill",
    });
  }
};

//get skills
const getMySkills = async (req, res) => {
  try {
    const userSkills = await UserSkill.find({
      user: req.user.userId,
    })
      .populate("skill", "name category description")
      .sort({ type: 1, createdAt: -1 });

    const skillsToTeach = userSkills.filter(
      (userSkill) => userSkill.type === "TEACH"
    );

    const skillsToLearn = userSkills.filter(
      (userSkill) => userSkill.type === "LEARN"
    );

    res.status(200).json({
      skillsToTeach,
      skillsToLearn,
    });
  } catch (error) {
    console.error("Get my skills error:", error);

    res.status(500).json({
      message: "Server error while fetching your skills",
    });
  }
};

module.exports = {
  addUserSkill,
  getMySkills,
};