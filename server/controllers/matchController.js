
const mongoose = require("mongoose");
const UserSkill = require("../models/UserSkill");

const findLearningMatches = async (req, res, next) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId || !mongoose.isValidObjectId(currentUserId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user.",
      });
    }

    // Find the skills the logged-in user wants to learn.
    const skillsToLearn = await UserSkill.find({
      user: currentUserId,
      type: "LEARN",
    })
      .select("skill")
      .populate("skill", "name category description")
      .lean();

    const skillIds = [
      ...new Set(
        skillsToLearn
          .filter((item) => item.skill)
          .map((item) => String(item.skill._id))
      ),
    ];

    if (skillIds.length === 0) {
      return res.status(200).json({
        matches: [],
        message: "Add some skills you want to learn first.",
      });
    }

    // Find other users who teach the requested skills.
    const matchingSkills = await UserSkill.find({
      user: { $ne: currentUserId },
      skill: { $in: skillIds },
      type: "TEACH",
    })
      .select("user skill level description")
      .populate("user", "name bio avatar languages")
      .populate("skill", "name category description")
      .lean();

    // Group matching skills by teacher.
    const teachersById = new Map();

    for (const item of matchingSkills) {
      if (!item.user || !item.skill) continue;

      const teacherId = String(item.user._id);

      // Never include the current user.
      if (teacherId === String(currentUserId)) continue;

      if (!teachersById.has(teacherId)) {
        teachersById.set(teacherId, {
          _id: teacherId,
          user: item.user,
          skills: [],
        });
      }

      const teacher = teachersById.get(teacherId);
      const skillId = String(item.skill._id);

      const alreadyAdded = teacher.skills.some(
        (skill) => String(skill._id) === skillId
      );

      if (!alreadyAdded) {
        teacher.skills.push({
          ...item.skill,
          level: item.level || "BEGINNER",
          teachingDescription: item.description || "",
        });
      }
    }

    return res.status(200).json({
      matches: Array.from(teachersById.values()),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  findLearningMatches,
};
