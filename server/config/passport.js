
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

if (!clientID || !clientSecret) {
  console.warn(
    "[Google OAuth] Credentials are missing; Google login is disabled."
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("[Google OAuth] Strategy callback executed");

        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value
            ?.trim()
            .toLowerCase();
          const name = profile.displayName?.trim();
          const avatar = profile.photos?.[0]?.value || "";

          // Do not rely on profile._json.email_verified alone.
          // Request Google's user-info endpoint to verify the email.
          const response = await fetch(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            console.error(
              "[Google OAuth] Could not verify Google user information:",
              response.status
            );

            return done(null, false, {
              message: "Could not verify your Google account. Please try again.",
            });
          }

          const googleUser = await response.json();

          if (
            !googleId ||
            !email ||
            !name ||
            googleUser.email !== email ||
            googleUser.email_verified !== true ||
            googleUser.sub !== googleId
          ) {
            console.error(
              "[Google OAuth] Google identity verification failed."
            );

            return done(null, false, {
              message: "Google account verification failed. Please try again.",
            });
          }

          if (name.length > 80 || email.length > 254) {
            return done(null, false, {
              message: "Google account details are invalid.",
            });
          }

          let user = await User.findOne({ googleId });

          if (user) {
            return done(null, user);
          }

          // Do not automatically link existing password accounts.
          const existingEmailUser = await User.findOne({ email });

          if (existingEmailUser) {
            return done(null, false, {
              message:
                "An account already exists with this email. Log in using your existing method first.",
            });
          }

          user = await User.create({
            name,
            email,
            googleId,
            avatar,
          });

          console.log("[Google OAuth] New account created");
          return done(null, user);
        } catch (error) {
          console.error("[Google OAuth] Strategy error:", {
            name: error.name,
            code: error.code,
            message: error.message,
          });

          if (error.code === 11000) {
            return done(null, false, {
              message:
                "This account already exists. Please try signing in again.",
            });
          }

          return done(error);
        }
      }
    )
  );
}

module.exports = passport;
