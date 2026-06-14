/**
 * User Controller
 * Handlers: getProfile, updateProfile, uploadProfileAvatar, removeProfileAvatar
 *
 * Rules:
 *  - All handlers wrapped in catchAsync
 *  - Profile mutations delegate entirely to user.service.js
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const {
  getUserById,
  updateUserProfile,
  setUserAvatar,
  removeUserAvatar,
} = require('./user.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
  avatar: user.avatar,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/profile
 *
 * Returns the authenticated user's full profile.
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await getUserById(req.user.id);
  sendSuccess(res, formatProfile(user), 'Profile retrieved successfully');
});

/**
 * PATCH /api/v1/users/profile
 *
 * Partial update — accepts any subset of { name, phone, bio, avatar }.
 * Passing avatar=null or avatar='' clears the stored photo.
 */
const updateProfile = catchAsync(async (req, res) => {
  const { name, phone, bio, avatar } = req.body;
  const user = await updateUserProfile(req.user.id, { name, phone, bio, avatar });
  sendSuccess(res, formatProfile(user), 'Profile updated successfully');
});

/**
 * POST /api/v1/users/profile/avatar
 *
 * Validates and stores a base64 data-URL avatar.
 */
const uploadProfileAvatar = catchAsync(async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) throw new AppError('Avatar data is required', 400);
  const user = await setUserAvatar(req.user.id, avatar);
  sendSuccess(res, formatProfile(user), 'Profile photo updated successfully');
});

/**
 * DELETE /api/v1/users/profile/avatar
 *
 * Removes the stored avatar for the authenticated user.
 */
const removeProfileAvatar = catchAsync(async (req, res) => {
  const user = await removeUserAvatar(req.user.id);
  sendSuccess(res, formatProfile(user), 'Profile photo removed successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
};
