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
 *   POST /logout    → logout
 *   GET  /me        → me
 *
 * Profile operations live at /api/v1/users (see user.routes.js)
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { register, login, logout, me, refresh } = require('./auth.controller');

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.use(authMiddleware);

router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
