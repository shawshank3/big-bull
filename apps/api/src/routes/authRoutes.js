/**
 * Auth Routes
 * Routes for user authentication
 */
const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/profile/avatar', authMiddleware, uploadProfileAvatar);
router.delete('/profile/avatar', authMiddleware, removeProfileAvatar);

module.exports = router;
