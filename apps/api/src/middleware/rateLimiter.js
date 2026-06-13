const rateLimit = require('express-rate-limit');

/**
 * Shared handler for all rate limit exceeded responses.
 * Returns the unified API error format.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 429,
      message: 'Too many requests. Please try again later.',
    },
  });
};

/**
 * authLimiter — relaxed for development (no effective limit).
 * TODO: tighten before production (e.g. 5 req / 15 min)
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * generalLimiter — relaxed for development (no effective limit).
 * TODO: tighten before production (e.g. 100 req / 15 min)
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * chatLimiter — relaxed for development (no effective limit).
 * TODO: tighten before production (e.g. 20 req / 1 min)
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, generalLimiter, chatLimiter };
