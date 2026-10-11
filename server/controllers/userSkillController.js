
const mongoose = require("mongoose");
const UserSkill = require("../models/UserSkill");
const Skill = require("../models/Skill");

// Add a skill to the authenticated user's profile.
const addUserSkill = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { skillId, type, level, description = "" } = req.body || {};

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Invalid authenticated user.",
      });
    }

    if (
      typeof skillId !== "string" ||
      !mongoose.isValidObjectId(skillId)
    ) {
      return res.status(400).json({
        message: "A valid skill ID is required.",
      });
    }

    if (!["TEACH", "LEARN"].includes(type)) {
      return res.status(400).json({
        message: "Type must be TEACH or LEARN.",
      });
    }

    if (
      !["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(level)
    ) {
      return res.status(400).json({
        message: "Invalid skill level.",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Description must be text of at most 500 characters.",
      });
    }

    const skill = await Skill.findById(skillId).select("_id");

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found.",
      });
    }

    // The authenticated user ID is always used; never trust a body user ID.
    const userSkill = await UserSkill.create({
      user: userId,
      skill: skillId,
      type,
      level,
      description: description.trim(),
    });

    const populatedUserSkill = await UserSkill.findById(userSkill._id)
      .populate("skill", "name category description");

    return res.status(201).json({
      message: "Skill added to your profile.",
      userSkill: populatedUserSkill,
    });
  } catch (error) {
    // Handles duplicates safely, including simultaneous requests.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have this skill for that type.",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid skill data.",
      });
    }

    console.error("Add user skill error:", error.message);

    return res.status(500).json({
      message: "Server error while adding skill.",
    });
  }
};

// Get the authenticated user's own skills.
const getMySkills = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Invalid authenticated user.",
      });
    }

    const userSkills = await UserSkill.find({ user: userId })
      .populate("skill", "name category description")
      .sort({ type: 1, createdAt: -1 });

    const validSkills = userSkills.filter((item) => item.skill);

    return res.status(200).json({
      skillsToTeach: validSkills.filter((item) => item.type === "TEACH"),
      skillsToLearn: validSkills.filter((item) => item.type === "LEARN"),
    });
  } catch (error) {
    console.error("Get my skills error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching your skills.",
    });
  }
};

// Get another user's publicly visible teaching skills.
const getTeachingSkillsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const teachingSkills = await UserSkill.find({
      user: userId,
      type: "TEACH",
    })
      .populate("skill", "name category description")
      .select("skill level description type user")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      teachingSkills: teachingSkills.filter((item) => item.skill),
    });
  } catch (error) {
    console.error("Get teaching skills error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching teaching skills.",
    });
  }
};


 // Update one of the authenticated user's skills.
const updateUserSkill = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { userSkillId } = req.params;
    const { level, description = "" } = req.body || {};

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Invalid authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(userSkillId)) {
      return res.status(400).json({
        message: "Invalid user skill ID.",
      });
    }

    if (
      !["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(level)
    ) {
      return res.status(400).json({
        message: "Invalid skill level.",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Description must be text of at most 500 characters.",
      });
    }

    const userSkill = await UserSkill.findOneAndUpdate(
      { _id: userSkillId, user: userId },
      {
        $set: {
          level,
          description: description.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("skill", "name category description");

    if (!userSkill) {
      return res.status(404).json({
        message: "Skill not found in your profile.",
      });
    }

    return res.status(200).json({
      message: "Skill updated successfully.",
      userSkill,
    });
  } catch (error) {
    console.error("Update user skill error:", error.message);

    return res.status(500).json({
      message: "Server error while updating skill.",
    });
  }
};

// Delete one of the authenticated user's skills.
const deleteUserSkill = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { userSkillId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Invalid authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(userSkillId)) {
      return res.status(400).json({
        message: "Invalid user skill ID.",
      });
    }

    const deletedSkill = await UserSkill.findOneAndDelete({
      _id: userSkillId,
      user: userId,
    });

    if (!deletedSkill) {
      return res.status(404).json({
        message: "Skill not found in your profile.",
      });
    }

    return res.status(200).json({
      message: "Skill removed from your profile.",
    });
  } catch (error) {
    console.error("Delete user skill error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting skill.",
    });
  }
};



module.exports = {
  addUserSkill,
  getMySkills,
  getTeachingSkillsByUserId,
  updateUserSkill,
  deleteUserSkill,
};
