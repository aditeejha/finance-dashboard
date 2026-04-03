// Rate limiter — implemented without extra dependencies using an in-memory store.
// Tracks request counts per IP address within a sliding time window.
// In production you would replace the store with Redis for multi-instance support.

const requestCounts = new Map(); // { ip -> { count, windowStart } }

/**
 * createRateLimiter(options)
 *   windowMs  — time window in milliseconds (default: 15 minutes)
 *   max       — max requests allowed per window (default: 100)
 *   message   — error message when limit is exceeded
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now - record.windowStart > windowMs) {
      // First request from this IP, or the window has expired — reset
      requestCounts.set(ip, { count: 1, windowStart: now });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - record.windowStart)) / 1000);
      res.set("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: `${retryAfterSeconds} seconds`,
      });
    }

    record.count += 1;
    next();
  };
};

// --- Pre-configured limiters used in the app ---

// General API limit: 100 requests per 15 minutes
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again after 15 minutes.",
});

// Stricter limit for auth routes to slow down brute-force attempts
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

module.exports = { generalLimiter, authLimiter };
