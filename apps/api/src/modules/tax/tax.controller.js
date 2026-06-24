/**
 * Tax Controller
 * Handles HTTP layer for capital gains, tax summary, and harvesting endpoints.
 *
 * Routes:
 *   GET /gains       → getGainsLedger
 *   GET /summary     → getTaxSummary
 *   GET /harvesting  → getHarvestingOpportunities
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const taxService = require('./tax.service');
const { gainsQuerySchema, summaryQuerySchema, harvestingQuerySchema } = require('./tax.validator');

/**
 * GET /tax/gains
 *
 * Returns paginated realized gain records for the authenticated user
 * scoped to the specified Indian Financial Year.
 */
const getGainsLedger = catchAsync(async (req, res) => {
  const result = gainsQuerySchema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid query parameters';
    throw new AppError(message, 400);
  }

  const { taxYear, page, limit } = result.data;
  const data = await taxService.getGainsLedger(req.user.id, { taxYear, page, limit });

  sendSuccess(res, data, 'Gains ledger retrieved');
});

/**
 * GET /tax/summary
 *
 * Returns a tax year summary with realized gains totals, estimated tax,
 * and harvesting opportunity count.
 */
const getTaxSummary = catchAsync(async (req, res) => {
  const result = summaryQuerySchema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid query parameters';
    throw new AppError(message, 400);
  }

  const { taxYear } = result.data;
  const data = await taxService.getTaxSummary(req.user.id, { taxYear });

  sendSuccess(res, data, 'Tax summary retrieved');
});

/**
 * GET /tax/harvesting
 *
 * Returns current holdings with unrealized losses that qualify as
 * tax-loss harvesting opportunities.
 */
const getHarvestingOpportunities = catchAsync(async (req, res) => {
  const result = harvestingQuerySchema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid query parameters';
    throw new AppError(message, 400);
  }

  const { taxYear, minLoss } = result.data;
  const data = await taxService.getHarvestingOpportunities(req.user.id, { taxYear, minLoss });

  sendSuccess(res, data, 'Harvesting opportunities retrieved');
});

module.exports = { getGainsLedger, getTaxSummary, getHarvestingOpportunities };
