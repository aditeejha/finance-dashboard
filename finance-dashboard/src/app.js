const express = require("express");
const app = express();
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");

// --- Core Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
// Stricter limit on auth routes to slow brute-force attacks
app.use("/api/auth", authLimiter);
// General limit on all other API routes
app.use("/api", generalLimiter);

// --- Routes ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "Finance Dashboard API is running." });
});

// --- Error Handling (must be last) ---
const { errorHandler, notFound } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

module.exports = app;
