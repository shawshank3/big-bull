/**
 * Transaction Routes
 * All routes are protected by authMiddleware (JWT cookie required).
 *
 *   GET  /api/v1/transactions        → getHistory   (paginated history)
 *   POST /api/v1/transactions/order  → executeOrder (place BUY / SELL)
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { executeOrder, getHistory } = require('./transaction.controller');

const router = Router();

// Require authentication for every route in this module
router.use(authMiddleware);

router.get('/', getHistory);
router.post('/order', executeOrder);

module.exports = router;
