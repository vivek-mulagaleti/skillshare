
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 6 &&
  password.length <= 128;

const createToken = (user) => {
  if (
    typeof process.env.JWT_SECRET !== "string" ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error("JWT configuration is invalid");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );
};

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  timeCredits: user.timeCredits,
  role: user.role,
});

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const cleanName = name.trim();

    if (!cleanName || cleanName.length > 80) {
      return res.status(400).json({
        message: "Name must be between 1 and 80 characters",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be between 6 and 128 characters",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: getSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Please check the registration details",
      });
    }

    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!isValidEmail(email.trim()) || password.length > 128) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token: createToken(user),
      user: getSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};


const googleLogin = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send("Google authentication failed.");
    }

    const token = createToken(req.user);

    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:5173";

    const frontendOrigin = clientUrl.split(",")[0].trim();

    const redirectUrl = new URL(
      "/auth/google/callback",
      frontendOrigin
    );

    redirectUrl.search = "";
    redirectUrl.hash = new URLSearchParams({
      token: token,
    }).toString();

    console.log(
      "[Google OAuth] Redirecting to frontend callback:",
      redirectUrl.origin + redirectUrl.pathname
    );

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[Google OAuth] JWT redirect failed:", error.message);
    return next(error);
  }
};


module.exports = {
  registerUser,
  loginUser,
  googleLogin,
};
