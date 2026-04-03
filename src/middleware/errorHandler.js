// Central error handling middleware.
// All errors thrown with next(err) land here.
// This keeps error formatting consistent across the whole API.

const errorHandler = (err, req, res, next) => {
  // Log the error in development for easy debugging
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
  }

  // Use the status code set on the error, or default to 500
  const statusCode = err.statusCode || 500;

  // Sequelize unique constraint violation (e.g. duplicate email)
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
      field: err.errors?.[0]?.path,
    });
  }

  // Sequelize validation error (from model-level validations)
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed.",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Generic fallback response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Catch-all for routes that don't exist
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

module.exports = { errorHandler, notFound };
