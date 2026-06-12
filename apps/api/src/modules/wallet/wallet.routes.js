/**
 * Wallet Routes
 * Mounted at /api/v1/wallet by server.js
 *
 * Protected routes (require authMiddleware):
 *   GET /  → getWallet
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { getWallet } = require('./wallet.controller');

const router = Router();

router.get('/', authMiddleware, getWallet);

module.exports = router;
