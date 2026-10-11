
const express = require("express");
const passport = require("../config/passport");

const {
  registerUser,
  loginUser,
  googleLogin,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Start Google authentication.
router.get("/google", (req, res, next) => {
  console.log("[Google OAuth] Login started");

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    console.error("[Google OAuth] Credentials are missing");

    return res.status(503).json({
      message: "Google login is not configured on the server.",
    });
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

// Handle Google's callback.
router.get("/google/callback", (req, res, next) => {
  console.log("[Google OAuth] Callback reached");

  passport.authenticate(
    "google",
    { session: false },
    (error, user, info) => {
      if (error) {
        console.error("[Google OAuth] Error:", error);
        return next(error);
      }

      if (!user) {
        console.error(
          "[Google OAuth] Login rejected:",
          info?.message || "No user returned by Passport"
        );

        const clientUrl =
          process.env.CLIENT_URL || "http://localhost:5173";

        const redirectUrl = new URL(
          "/login",
          clientUrl.split(",")[0].trim()
        );

        redirectUrl.searchParams.set(
          "googleError",
          info?.message || "Google sign-in failed."
        );

        return res.redirect(redirectUrl.toString());
      }

      console.log("[Google OAuth] User authenticated successfully");

      req.user = user;
      return googleLogin(req, res, next);
    }
  )(req, res, next);
});

module.exports = router;
