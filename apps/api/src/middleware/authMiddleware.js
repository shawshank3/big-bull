/**
 * JWT Middleware
 * Cookie-based auth for /api/v1/* routes.
 * Reads the JWT from req.cookies.access_token.
 */
const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../shared/constants');

const authMiddleware = (req, res, next) => {
  const token = req.cookies && req.cookies.access_token;

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: { code: HTTP_STATUS.UNAUTHORIZED, message: 'No authentication token provided' },
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
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: { code: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid or expired token' },
    });
  }
};

module.exports = authMiddleware;
