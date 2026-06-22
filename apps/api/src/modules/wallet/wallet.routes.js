/**
 * Wallet Routes
 * Mounted at /api/v1/wallet by server.js
 *
 * Protected routes (require authMiddleware):
 *   GET  /                     → getWallet
 *   POST /transactions/list    → listWalletTransactions (paginated, filtered — standardised)
 *   GET  /transactions         → getWalletTransactions  (legacy)
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { getWallet, getWalletTransactions, listWalletTransactions } = require('./wallet.controller');

const router = Router();

router.use(authMiddleware);

router.get('/', getWallet);
router.post('/transactions/list', listWalletTransactions);
router.get('/transactions', getWalletTransactions); // legacy

module.exports = router;
