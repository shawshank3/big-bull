/**
 * JWT Utils
 * Utility functions for JWT token generation and verification
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

const buildAccessPayload = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
});

const generateAccessToken = (user) => {
  return jwt.sign(buildAccessPayload(user), JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

// Backward-compatible alias
const generateToken = generateAccessToken;

const verifyToken = (token) => {
  try {
    return verifyAccessToken(token);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
};
