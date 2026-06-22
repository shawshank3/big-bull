/**
 * Auth Service
 * Business logic for authentication: issuing/clearing cookies,
 * validating credentials.
 */
const crypto = require('crypto');
const User = require('../user/user.model');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const AppError = require('../../shared/AppError');
const { HTTP_STATUS } = require('../../shared/constants');

// ─── Expiry Parsing ───────────────────────────────────────────────────────────

const MULTIPLIERS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const EXPIRY_RE = /^(\d+)(s|m|h|d)$/;

/**
 * parseExpiry(str)
 *
 * Converts a JWT expiry string (e.g. '30s', '2h', '7d') to an integer number
 * of milliseconds. Throws an Error if the string does not match the expected
 * format so misconfigured env vars surface immediately at call time.
 *
 * @param {string} str  - e.g. '30s', '15m', '2h', '7d'
 * @returns {number}    - milliseconds
 * @throws {Error}      - if str does not match /^(\d+)(s|m|h|d)$/
 */
const parseExpiry = (str) => {
  const match = EXPIRY_RE.exec(str);
  if (!match) {
    throw new Error(`parseExpiry: invalid expiry string "${str}"`);
  }
  return parseInt(match[1], 10) * MULTIPLIERS[match[2]];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a token string.
 * The hash is stored in MongoDB so the raw refresh token never persists at rest.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Shared cookie options (security flags). */
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge,
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * issueAuthCookies(res, user)
 *
 * Signs access and refresh tokens, sets both as HTTP-Only cookies on the
 * response, and persists a SHA-256 hash of the refresh token to the user
 * document in MongoDB.
 *
 * @param {import('express').Response} res
 * @param {import('mongoose').Document} user  - must be a Mongoose User document
 */
const issueAuthCookies = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store only the hash — never the raw token
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie(
    'access_token',
    accessToken,
    cookieOptions(parseExpiry(process.env.JWT_ACCESS_EXPIRES))
  );
  res.cookie(
    'refresh_token',
    refreshToken,
    cookieOptions(parseExpiry(process.env.JWT_REFRESH_EXPIRES))
  );
};

/**
 * clearAuthCookies(res)
 *
 * Clears both auth cookies from the response.
 *
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
};

/**
 * validateCredentials(email, password)
 *
 * Finds a user by email (selecting the normally-excluded password field),
 * verifies the plain-text password against the bcrypt hash, and returns the
 * user document on success.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('mongoose').Document>}
 * @throws {AppError} 401 if email not found or password does not match
 */
const validateCredentials = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  return user;
};

module.exports = {
  parseExpiry,
  issueAuthCookies,
  clearAuthCookies,
  validateCredentials,
};
