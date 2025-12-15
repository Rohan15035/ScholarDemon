const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const papersRoutes = require("./routes/papers");
const authorsRoutes = require("./routes/authors");
const libraryRoutes = require("./routes/library");
const commentsRoutes = require("./routes/comments");
const followsRoutes = require("./routes/follows");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/papers", papersRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/follows", followsRoutes);

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════╗
    ║  ScholarDemon Server Running          ║
    ╠═══════════════════════════════════════╣
    ║  Port: ${PORT.toString().padEnd(30)} ║
    ║  Environment: ${(process.env.NODE_ENV || "development").padEnd(22)} ║
    ║  Time: ${new Date().toLocaleString().padEnd(22)} ║
    ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

module.exports = app;
