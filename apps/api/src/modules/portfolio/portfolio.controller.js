/**
 * Portfolio Controller
 *
 * Handles HTTP requests for the portfolio module.
 * All handlers are wrapped in catchAsync so unhandled rejections propagate
 * to the global Express error handler.
 */
'use strict';

const catchAsync = require('../../shared/catchAsync');
const { sendSuccess } = require('../../utils/response');
const portfolioService = require('./portfolio.service');

/**
 * GET /portfolio/holdings
 * Returns the authenticated user's enriched holdings list.
 */
const getHoldings = catchAsync(async (req, res) => {
  const holdings = await portfolioService.computeHoldings(req.user.id);
  sendSuccess(res, { holdings }, 'Holdings retrieved');
});

/**
 * GET /portfolio/summary
 * Returns a high-level portfolio summary for the authenticated user.
 */
const getSummary = catchAsync(async (req, res) => {
  const summary = await portfolioService.computeSummary(req.user.id);
  sendSuccess(res, summary, 'Portfolio summary retrieved');
});

module.exports = {
  getHoldings,
  getSummary,
};
