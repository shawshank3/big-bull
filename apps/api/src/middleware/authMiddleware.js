/**
 * JWT Middleware
 * Provides two middleware functions:
 *  - authMiddleware: reads JWT from HTTP-Only cookie `access_token` (used by /api/v1/* routes)
 *  - legacyAuthMiddleware: reads JWT from `Authorization: Bearer` header (used by legacy /api/* routes)
 */
const jwt = require('jsonwebtoken');

/**
 * Cookie-based auth middleware for /api/v1/* routes.
 * Reads the JWT from req.cookies.access_token.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies && req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 401, message: 'No authentication token provided' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 401, message: 'Invalid or expired token' },
    });
  }
};

/**
 * Legacy Bearer-token auth middleware for /api/* routes.
 * Reads the JWT from the Authorization header.
 */
const legacyAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 401, message: 'No authentication token provided' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 401, message: 'Invalid or expired token' },
    });
  }
};

module.exports = authMiddleware;                          // default export for backward compat
module.exports.authMiddleware = authMiddleware;
module.exports.legacyAuthMiddleware = legacyAuthMiddleware;
