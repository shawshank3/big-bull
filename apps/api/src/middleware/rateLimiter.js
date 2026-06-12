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
 * authLimiter — 5 requests per 15 minutes per IP.
 * Applied to login, register, and other auth endpoints to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 0.25 * 60 * 1000, // 15 seconds for testing, change to 15 * 60 * 1000 for production
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * generalLimiter — 100 requests per 15 minutes per IP.
 * Applied broadly to most API routes.
 */
const generalLimiter = rateLimit({
  windowMs: 0.25 * 60 * 1000, // 15 seconds for testing, change to 15 * 60 * 1000 for production
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * chatLimiter — 20 requests per 1 minute per IP.
 * Applied to chat/AI endpoints to prevent abuse of expensive LLM calls.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, generalLimiter, chatLimiter };
