
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const skillRoutes = require("./routes/skillRoutes");
const userSkillRoutes = require("./routes/userSkillRoutes");
const matchRoutes = require("./routes/matchRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// Security: don't expose the Express framework version.
app.disable("x-powered-by");

// Security: set standard HTTP security headers.
app.use(helmet());

// Security: allow only explicitly configured frontend origins.
// Set CLIENT_URL to your frontend origin in production.
// Multiple origins can be comma-separated.
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

if (process.env.NODE_ENV !== "production") {
  configuredOrigins.push("http://localhost:5173");
}

const allowedOrigins = new Set(configuredOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header include server-to-server tools.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Don't grant CORS access to unknown browser origins.
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

// Security: limit JSON body size to reduce oversized request abuse.
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillShare API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/user-skills", userSkillRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler

 // Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = Number(err.statusCode || err.status) || 500;
  let message = "Internal server error";

  // Handle malformed JSON request bodies.
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON request body.";
  }
  // Handle request bodies exceeding the configured limit.
  else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large.";
  }
  // Never expose internal error messages to clients.
  else if (status >= 400 && status < 500) {
    message = "Request could not be processed.";
  } else {
    status = 500;
  }

  console.error("API error:", {
    method: req.method,
    path: req.path,
    status,
    message: err.message,
  });

  return res.status(status).json({
    success: false,
    message,
  });
});


// Start only after configuration checks and database connection.
const startServer = async () => {
  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        "JWT_SECRET is missing or too short. Configure a secret of at least 32 characters.",
      );
    }

    if (
      process.env.NODE_ENV === "production" &&
      configuredOrigins.length === 0
    ) {
      throw new Error(
        "CLIENT_URL must be configured before running in production.",
      );
    }

    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`SkillShare server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
