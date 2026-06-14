/**
 * Auth Controller
 * Handlers: register, login, logout, me, refresh
 *
 * Rules:
 *  - All handlers wrapped in catchAsync (no bare try/catch)
 *  - All mutating handlers validate via Zod (.safeParse → AppError 400 on failure)
 *  - JWT is NEVER in the response body — only HTTP-Only cookies via issueAuthCookies
 *  - Response body on login/register: { user: { id, name, email, role } }
 *
 * Profile operations (getProfile, updateProfile, avatar) live in user.controller.js
 */
const crypto = require('crypto');
const User = require('../user/user.model');
const VirtualWallet = require('../wallet/wallet.model');
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const { registerSchema, loginSchema } = require('./auth.validator');
const { issueAuthCookies, clearAuthCookies, validateCredentials } = require('./auth.service');
const { getUserById } = require('../user/user.service');
const { verifyRefreshToken } = require('../../utils/jwt');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** SHA-256 hash a raw token string (mirrors auth.service.js hashToken). */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Shape the user object returned in auth response bodies. */
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 *
 * 1. Validate body with registerSchema
 * 2. Check email uniqueness (409 if taken)
 * 3. Create User
 * 4. Seed a virtual wallet
 * 5. Issue auth cookies
 * 6. Return user object (201)
 */
const register = catchAsync(async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid registration payload';
    throw new AppError(message, 400);
  }

  const { name, email, password } = result.data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with that email already exists', 409);
  }

  const user = await User.create({ name, email, password });

  // Seed a ₹10,00,000 virtual wallet for every new user
  await VirtualWallet.create({ userId: user._id, balance: 1000000 });

  await issueAuthCookies(res, user);

  sendSuccess(res, { user: formatUser(user) }, 'Registration successful', 201);
});

/**
 * POST /api/v1/auth/login
 *
 * 1. Validate body with loginSchema
 * 2. validateCredentials (throws 401 on mismatch)
 * 3. Issue auth cookies
 * 4. Return user object (200)
 */
const login = catchAsync(async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid login payload';
    throw new AppError(message, 400);
  }

  const { email, password } = result.data;

  const user = await validateCredentials(email, password);

  await issueAuthCookies(res, user);

  sendSuccess(res, { user: formatUser(user) }, 'Login successful', 200);
});

/**
 * POST /api/v1/auth/logout
 *
 * 1. Find user by req.user.id
 * 2. Null out stored refresh token hash
 * 3. Clear auth cookies
 */
const logout = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('+refreshToken');
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  clearAuthCookies(res);

  sendSuccess(res, null, 'Logged out successfully', 200);
});

/**
 * GET /api/v1/auth/me
 *
 * Returns the authenticated user's minimal identity (id, name, email, role).
 * For full profile data use GET /api/v1/users/profile.
 */
const me = catchAsync(async (req, res) => {
  const user = await getUserById(req.user.id);
  sendSuccess(res, { user: formatUser(user) }, 'User fetched successfully', 200);
});

/**
 * POST /api/v1/auth/refresh
 *
 * 1. Read refresh token from cookie
 * 2. Verify JWT signature / expiry
 * 3. Load user with refreshToken field (+refreshToken)
 * 4. Hash incoming token and compare to stored hash (401 on mismatch)
 * 5. Issue new cookies (rotation — old hash replaced inside issueAuthCookies)
 * 6. Return user object
 */
const refresh = catchAsync(async (req, res) => {
  const incomingToken = req.cookies?.refresh_token;
  if (!incomingToken) {
    throw new AppError('No refresh token provided', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) {
    throw new AppError('User not found', 401);
  }

  const incomingHash = hashToken(incomingToken);
  if (!user.refreshToken || user.refreshToken !== incomingHash) {
    throw new AppError('Refresh token has been revoked or reused', 401);
  }

  await issueAuthCookies(res, user);

  sendSuccess(res, { user: formatUser(user) }, 'Token refreshed successfully', 200);
});

module.exports = {
  register,
  login,
  logout,
  me,
  refresh,
};
