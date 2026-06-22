/**
 * Chart Controller
 *
 * Handles HTTP requests for historical chart data.
 * Follows the existing controller → service → model pattern.
 *
 * This controller has NO knowledge of Redis, SSE, or live prices.
 * All data is served exclusively from the MongoDB historical collections
 * (StockPriceHistory and DailyPrice).
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const { chartQuerySchema } = require('./chart.validator');
const chartService = require('./chart.service');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * GET /market/chart/:ticker?range=1D|1W|1M|3M|1Y
 *
 * Returns the historical price series for the given ticker and range.
 *
 * Path params:
 *   ticker  - NSE stock symbol or MFAPI scheme code (case-insensitive)
 *
 * Query params:
 *   range   - '1D' | '1W' | '1M' | '3M' | '1Y'  (default: '1D')
 *
 * Response data shape:
 * {
 *   ticker:      string,
 *   assetType:   'STOCK' | 'MUTUAL_FUND',
 *   range:       string,
 *   granularity: '30s' | 'daily',
 *   points: [{ timestamp: string, price: number, change?: number, changePercent?: string }]
 * }
 */
const getChart = catchAsync(async (req, res) => {
  const ticker = req.params.ticker?.trim().toUpperCase();
  if (!ticker) {
    throw new AppError('ticker param is required', HTTP_STATUS.BAD_REQUEST);
  }

  const result = chartQuerySchema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid query parameters';
    throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  const { range } = result.data;
  const chart = await chartService.getChart(ticker, range);
  sendSuccess(res, chart, 'Chart data retrieved');
});

module.exports = { getChart };
