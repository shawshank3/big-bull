/**
 * Auth Controller
 * Handles authentication logic
 */
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { validateAvatarData } = require('../utils/avatarData');

const formatProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
  avatar: user.avatar,
});

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return sendError(res, 'Please provide all required fields', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already registered', 400);
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user);

    // Return success response
    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }, 'Registration successful', 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, error.message || 'Registration failed', 500);
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    // Return success response
    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, error.message || 'Login failed', 500);
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, formatProfile(user), 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, error.message || 'Failed to get profile', 500);
  }
};

// Update Profile (partial update via PATCH)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        updates.avatar = null;
      } else {
        const { avatar: validAvatar, error } = validateAvatarData(avatar);
        if (error) return sendError(res, error, 400);
        updates.avatar = validAvatar;
      }
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No fields to update', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, formatProfile(user), 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, error.message || 'Failed to update profile', 500);
  }
};

// Save profile photo in DB (base64 data URL)
const uploadProfileAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const { avatar: validAvatar, error } = validateAvatarData(avatar);
    if (error) return sendError(res, error, 400);

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.avatar = validAvatar;
    await user.save();

    return sendSuccess(res, formatProfile(user), 'Profile photo updated successfully');
  } catch (error) {
    console.error('Upload avatar error:', error);
    return sendError(res, error.message || 'Failed to upload profile photo', 500);
  }
};

// Remove profile photo from DB
const removeProfileAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.avatar = null;
    await user.save();

    return sendSuccess(res, formatProfile(user), 'Profile photo removed successfully');
  } catch (error) {
    console.error('Remove avatar error:', error);
    return sendError(res, error.message || 'Failed to remove profile photo', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
};
