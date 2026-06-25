/**
 * Insights Routes
 * Mounted at /api/v1/insights by server.js
 *
 * All routes are public (no auth required).
 *
 *   GET /  → getPlatformInsights
 */
const { Router } = require('express');
const { getPlatformInsights } = require('./insights.controller');

const router = Router();

router.get('/', getPlatformInsights);

module.exports = router;
