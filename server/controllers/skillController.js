
const Skill = require("../models/Skill");

// Escape special regex characters so user input cannot change the query.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createSkill = async (req, res) => {
  try {
    const { name, category, description = "" } = req.body || {};

    // Validate input types.
    if (
      typeof name !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Skill name, category, and description must be text.",
      });
    }

    const cleanName = name.trim();
    const cleanCategory = category.trim();
    const cleanDescription = description.trim();

    // Validate required fields.
    if (!cleanName || !cleanCategory) {
      return res.status(400).json({
        message: "Skill name and category are required.",
      });
    }

    // Apply reasonable input limits.
    if (cleanName.length > 100) {
      return res.status(400).json({
        message: "Skill name must be at most 100 characters.",
      });
    }

    if (cleanCategory.length > 80) {
      return res.status(400).json({
        message: "Skill category must be at most 80 characters.",
      });
    }

    if (cleanDescription.length > 1000) {
      return res.status(400).json({
        message: "Skill description must be at most 1000 characters.",
      });
    }

    // Case-insensitive duplicate check with escaped user input.
    const existingSkill = await Skill.findOne({
      name: {
        $regex: `^${escapeRegex(cleanName)}$`,
        $options: "i",
      },
    });

    if (existingSkill) {
      return res.status(409).json({
        message: "This skill already exists.",
        skill: existingSkill,
      });
    }

    const skill = await Skill.create({
      name: cleanName,
      category: cleanCategory,
      description: cleanDescription,
    });

    return res.status(201).json({
      message: "Skill created successfully.",
      skill,
    });
  } catch (error) {
    // Handle a duplicate-key error if a unique index exists.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This skill already exists.",
      });
    }

    console.error("Create skill error:", error.message);

    return res.status(500).json({
      message: "Server error while creating skill.",
    });
  }
};

const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });

    return res.status(200).json({
      skills,
    });
  } catch (error) {
    console.error("Get skills error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching skills.",
    });
  }
};

module.exports = {
  createSkill,
  getSkills,
};
