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

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, generalLimiter, chatLimiter };
