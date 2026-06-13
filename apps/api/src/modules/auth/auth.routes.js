/**
 * Auth Routes
 * Mounted at /api/v1/auth by server.js
 *
 * Public routes (no middleware):
 *   POST /register  → register
 *   POST /login     → login
 *   POST /refresh   → refresh  (reads refresh_token cookie)
 *
 * Protected routes (require authMiddleware):
 *   POST /logout           → logout
 *   GET  /me               → me
 *   GET  /profile          → getProfile
 *   PATCH /profile         → updateProfile
 *   POST  /profile/avatar  → uploadProfileAvatar
 *   DELETE /profile/avatar → removeProfileAvatar
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  me,
  refresh,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
} = require('./auth.controller');

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);
router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/profile/avatar', authMiddleware, uploadProfileAvatar);
router.delete('/profile/avatar', authMiddleware, removeProfileAvatar);

module.exports = router;
