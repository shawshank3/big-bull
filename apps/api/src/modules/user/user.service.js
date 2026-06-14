/**
 * User Service
 * Business logic for user profile operations.
 * Auth module calls into here when it needs user data.
 */
const User = require('./user.model');
const AppError = require('../../shared/AppError');
const { validateAvatarData } = require('../../utils/avatarData');

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
  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * updateUserProfile(id, updates)
 *
 * Applies a partial update to the user's profile fields.
 * Validates avatar data if provided.
 *
 * @param {string} id
 * @param {{ name?, phone?, bio?, avatar? }} updates
 * @returns {Promise<import('mongoose').Document>}
 * @throws {AppError} 400 on invalid avatar | 404 if user not found
 */
const updateUserProfile = async (id, updates) => {
  const patch = {};

  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.bio !== undefined) patch.bio = updates.bio;

  if (updates.avatar !== undefined) {
    if (updates.avatar === null || updates.avatar === '') {
      patch.avatar = null;
    } else {
      const { avatar: validAvatar, error } = validateAvatarData(updates.avatar);
      if (error) throw new AppError(error, 400);
      patch.avatar = validAvatar;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  const user = await User.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * setUserAvatar(id, avatarData)
 *
 * Validates and stores a base64 data-URL avatar.
 *
 * @param {string} id
 * @param {string} avatarData
 * @returns {Promise<import('mongoose').Document>}
 * @throws {AppError} 400 on invalid data | 404 if user not found
 */
const setUserAvatar = async (id, avatarData) => {
  const { avatar: validAvatar, error } = validateAvatarData(avatarData);
  if (error) throw new AppError(error, 400);

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  user.avatar = validAvatar;
  await user.save();
  return user;
};

/**
 * removeUserAvatar(id)
 *
 * Clears the stored avatar for a user.
 *
 * @param {string} id
 * @returns {Promise<import('mongoose').Document>}
 * @throws {AppError} 404 if user not found
 */
const removeUserAvatar = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  user.avatar = null;
  await user.save();
  return user;
};

module.exports = {
  getUserById,
  updateUserProfile,
  setUserAvatar,
  removeUserAvatar,
};
