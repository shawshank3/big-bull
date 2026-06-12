/**
 * Portfolio Routes
 *
 * All routes require a valid session cookie (authMiddleware).
 *
 * GET /holdings  – enriched holdings list
 * GET /summary   – portfolio summary (PnL, cash balance, etc.)
 */
'use strict';

const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { getHoldings, getSummary } = require('./portfolio.controller');

const router = Router();

router.use(authMiddleware);

router.get('/holdings', getHoldings);
router.get('/summary', getSummary);

module.exports = router;
