/**
 * User Routes
 * Mounted at /api/v1/users by server.js
 *
 * All routes require authentication (authMiddleware applied globally below).
 *
 *   GET    /profile          → getProfile
 *   PATCH  /profile          → updateProfile
 *   POST   /profile/avatar   → uploadProfileAvatar
 *   DELETE /profile/avatar   → removeProfileAvatar
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
} = require('./user.controller');

const router = Router();

// All user routes require an authenticated session
router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/profile/avatar', uploadProfileAvatar);
router.delete('/profile/avatar', removeProfileAvatar);

module.exports = router;
