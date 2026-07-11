/**
 * Tax Routes
 * All routes are protected by authMiddleware (JWT cookie required).
 *
 *   GET /api/v1/tax/gains       → getGainsLedger      (paginated realized gains)
 *   GET /api/v1/tax/summary     → getTaxSummary       (FY tax summary)
 *   GET /api/v1/tax/harvesting  → getHarvestingOpportunities (delivery + intraday harvesting)
 *   GET /api/v1/tax/overview    → getFYOverview       (config-agnostic chart data)
 */
const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  getGainsLedger,
  getTaxSummary,
  getHarvestingOpportunities,
  getFYOverview,
} = require('./tax.controller');

const router = Router();

// Require authentication for every route in this module
router.use(authMiddleware);

router.get('/gains', getGainsLedger);
router.get('/summary', getTaxSummary);
router.get('/harvesting', getHarvestingOpportunities);
router.get('/overview', getFYOverview);

module.exports = router;
