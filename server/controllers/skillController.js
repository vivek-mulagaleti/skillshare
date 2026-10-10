const Skill = require("../models/Skill");

const createSkill = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: "Skill name and category are required",
      });
    }

    const existingSkill = await Skill.findOne({
      name: name.trim(),
    });

    if (existingSkill) {
      return res.status(409).json({
        message: "This skill already exists",
        skill: existingSkill,
      });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category: category.trim(),
      description: description || "",
    });

    res.status(201).json({
      message: "Skill created successfully",
      skill,
    });
  } catch (error) {
    console.error("Create skill error:", error);

    res.status(500).json({
      message: "Server error while creating skill",
    });
  }
};

const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });

    res.status(200).json({
      skills,
    });
  } catch (error) {
    console.error("Get skills error:", error);

    res.status(500).json({
      message: "Server error while fetching skills",
    });
  }
};

module.exports = {
  createSkill,
  getSkills,
};