/**
 * Auth Routes
 * Mounted at /api/v1/auth by server.js (task 2.7)
 *
 * Public routes (no middleware):
 *   POST /register  → register
 *   POST /login     → login
 *   POST /refresh   → refresh  (reads refresh_token cookie)
 *
 * Protected routes (require authMiddleware):
 *   POST /logout    → logout
 *   GET  /me        → me
 *
 * Note: authMiddleware currently reads from the Authorization header.
 * It will be updated to read from the access_token cookie in task 2.6.
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  me,
  refresh,
} = require('./auth.controller');

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

module.exports = router;
