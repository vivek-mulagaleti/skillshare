
const mongoose = require("mongoose");
const User = require("../models/User");

// Get the currently authenticated user's profile.
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update only the authenticated user's allowed profile fields.

const updateMyProfile = async (req, res, next) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "Request body must be a JSON object",
      });
    }

    const { name, bio, languages, avatar } = req.body;

    // Reject requests that contain no editable profile fields.
    const allowedFields = ["name", "bio", "languages", "avatar"];
    const suppliedFields = Object.keys(req.body);

    if (
      suppliedFields.length === 0 ||
      !suppliedFields.some((field) => allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Provide at least one valid profile field",
      });
    }

    // Validate name.
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 80
      ) {
        return res.status(400).json({
          message: "Name must be between 1 and 80 characters",
        });
      }
    }

    // Validate bio.
    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 500) {
        return res.status(400).json({
          message: "Bio must be a string of at most 500 characters",
        });
      }
    }

    // Validate languages.
    if (languages !== undefined) {
      if (
        !Array.isArray(languages) ||
        languages.length > 20 ||
        !languages.every(
          (language) =>
            typeof language === "string" &&
            language.trim().length > 0 &&
            language.trim().length <= 40
        )
      ) {
        return res.status(400).json({
          message: "Languages must be an array of up to 20 valid strings",
        });
      }
    }

    // Validate avatar.
    if (avatar !== undefined) {
      if (typeof avatar !== "string" || avatar.length > 5000) {
        return res.status(400).json({
          message: "Avatar must be a string of at most 5000 characters",
        });
      }
    }

    // Ignore role, timeCredits, email, and other protected fields.
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (languages !== undefined) {
      user.languages = languages.map((language) => language.trim());
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        languages: user.languages,
        timeCredits: user.timeCredits,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid profile data",
      });
    }

    return next(error);
  }
};


// Get another user's limited public profile.
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select(
      "_id name bio avatar languages timeCredits createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserById,
};
