/**
 * Transaction Routes
 * All routes are protected by authMiddleware (JWT cookie required).
 *
 *   POST /api/v1/transactions/list   → listTransactions (paginated, filtered — standardised)
 *   POST /api/v1/transactions/order  → executeOrder     (place BUY / SELL)
 *   GET  /api/v1/transactions        → getHistory       (legacy paginated history)
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { executeOrder, getHistory, listTransactions } = require('./transaction.controller');

const router = Router();

// Require authentication for every route in this module
router.use(authMiddleware);

router.post('/list', listTransactions);
router.post('/order', executeOrder);
router.get('/', getHistory); // legacy — kept for backward compat

module.exports = router;
