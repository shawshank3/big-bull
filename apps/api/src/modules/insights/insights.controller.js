/**
 * Insights Controller
 * Public endpoint returning platform-wide statistics.
 */
const catchAsync = require('../../shared/catchAsync');
const { sendSuccess } = require('../../utils/response');
const { getInsights } = require('./insights.service');

/**
 * GET /api/v1/insights
 * Public — returns platform stats (stock count, MF count, user count, total trades).
 */
const getPlatformInsights = catchAsync(async (req, res) => {
  const insights = await getInsights();
  sendSuccess(res, insights, 'Platform insights retrieved');
});

module.exports = { getPlatformInsights };
