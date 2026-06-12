/**
 * Auth Service
 * Business logic for authentication: issuing/clearing cookies,
 * validating credentials, and fetching users.
 */
const crypto = require('crypto');
const User = require('../../models/User');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const AppError = require('../../shared/AppError');

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_MAX_AGE  = 15 * 60 * 1000;           // 15 minutes in ms
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;  // 7 days in ms

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a token string (same pattern as legacy authController.js).
 * The hash is stored in MongoDB so the raw refresh token never persists at rest.
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

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
 * Signs an access token (15 min) and a refresh token (7 days), sets both as
 * HTTP-Only cookies on the response, and persists a SHA-256 hash of the
 * refresh token to the user document in MongoDB.
 *
 * @param {import('express').Response} res
 * @param {import('mongoose').Document} user  - must be a Mongoose User document
 */
const issueAuthCookies = async (res, user) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store only the hash — never the raw token
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('access_token',  accessToken,  cookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie('refresh_token', refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
};

/**
 * clearAuthCookies(res)
 *
 * Clears both auth cookies from the response.
 *
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  res.clearCookie('access_token',  { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
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
    throw new AppError('Invalid email or password', 401);
  }

  return user;
};

/**
 * getUserById(id)
 *
 * Finds a user by their MongoDB _id and returns the document.
 *
 * @param {string} id  - MongoDB ObjectId string
 * @returns {Promise<import('mongoose').Document>}
 * @throws {AppError} 404 if no user found with the given id
 */
const getUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

module.exports = {
  issueAuthCookies,
  clearAuthCookies,
  validateCredentials,
  getUserById,
};
