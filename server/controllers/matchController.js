const UserSkill = require("../models/UserSkill");

const findLearningMatches = async (req, res) => {
  try {
    // Find skills this user wants to learn
    const skillsToLearn = await UserSkill.find({
      user: req.user.userId,
      type: "LEARN",
    }).populate("skill", "name category description");

    if (skillsToLearn.length === 0) {
      return res.status(200).json({
        matches: [],
        message: "Add some skills you want to learn first.",
      });
    }

    const skillIds = skillsToLearn.map(
      (userSkill) => userSkill.skill._id
    );

    // Find other users who teach those skills
    const matchingSkills = await UserSkill.find({
      user: { $ne: req.user.userId },
      skill: { $in: skillIds },
      type: "TEACH",
    })
      .populate("user", "name bio avatar languages")
      .populate("skill", "name category description");

    res.status(200).json({
      matches: matchingSkills,
    });
  } catch (error) {
    console.error("Find learning matches error:", error);

    res.status(500).json({
      message: "Server error while finding matches",
    });
  }
};

module.exports = {
  findLearningMatches,
};