/**
 * Chart Service
 *
 * Returns historical price series for the chart API.
 *
 * Data sources:
 *   - StockPriceHistory  → intraday 30-second points for STOCK assets (1D range)
 *   - DailyPrice         → daily closing prices / NAVs for multi-day ranges
 *
 * Rules enforced:
 *   - Mutual funds have NO intraday history; the 1D range for a MF returns the
 *     same response shape as daily data (the current day's NAV only).
 *   - The 1D range for stocks returns all 30-second ticks recorded today.
 *   - 1W / 1M / 3M / 1Y always use daily data for both asset types.
 *   - These collections are NEVER used for order execution, portfolio valuation,
 *     or any runtime price resolution — they are read-only analytics stores.
 */

const Asset = require('../asset/asset.model');
const StockPriceHistory = require('./stockPriceHistory.model');
const DailyPrice = require('./dailyPrice.model');
const AppError = require('../../shared/AppError');

// ─── Range configuration ─────────────────────────────────────────────────────

/**
 * Number of calendar days to look back for each multi-day range.
 * 1D is handled separately (intraday minutes, not days back).
 */
const RANGE_DAYS = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

const VALID_RANGES = ['1D', '1W', '1M', '3M', '1Y'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the current date as a YYYY-MM-DD string in IST (UTC+5:30).
 */
const todayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

/**
 * Returns a YYYY-MM-DD string for N calendar days ago in IST.
 */
const daysAgoIST = (n) => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 - n * 86400 * 1000);
  return ist.toISOString().slice(0, 10);
};

/**
 * Returns the UTC start-of-day (midnight) for a YYYY-MM-DD IST date string.
 * Used to build the Date filter for StockPriceHistory timestamp queries.
 *
 * IST is UTC+5:30, so IST midnight = previous-day 18:30 UTC.
 */
const istDayStartUTC = (dateStr) => {
  // Parse as IST 00:00:00 → subtract 5 h 30 m to get UTC equivalent
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
};

const istDayEndUTC = (dateStr) => {
  const start = istDayStartUTC(dateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000); // next day start
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * getChart(ticker, range)
 *
 * Returns the price history series for a given asset and time range.
 *
 * Response shape:
 * {
 *   ticker:    string,
 *   assetType: 'STOCK' | 'MUTUAL_FUND',
 *   range:     '1D' | '1W' | '1M' | '3M' | '1Y',
 *   granularity: '30s' | 'daily',
 *   points: [
 *     { timestamp: string (ISO), price: number, change?: number, changePercent?: string }
 *   ]
 * }
 *
 * @param {string} ticker  - NSE ticker or MF scheme code
 * @param {string} range   - one of '1D' | '1W' | '1M' | '3M' | '1Y'
 * @returns {Promise<object>}
 * @throws {AppError} 400 for invalid range, 404 if asset not found
 */
const getChart = async (ticker, range) => {
  const upperTicker = ticker.toUpperCase();
  const upperRange = range.toUpperCase();

  if (!VALID_RANGES.includes(upperRange)) {
    throw new AppError(`Invalid range "${range}". Valid values: ${VALID_RANGES.join(', ')}`, 400);
  }

  const asset = await Asset.findOne({ ticker: upperTicker }).lean();
  if (!asset) {
    throw new AppError(`Asset not found: ${ticker}`, 404);
  }

  // ── 1D range ────────────────────────────────────────────────────────────
  if (upperRange === '1D') {
    return get1DChart(asset);
  }

  // ── Multi-day ranges ─────────────────────────────────────────────────────
  return getDailyChart(asset, upperRange);
};

/**
 * get1DChart(asset)
 *
 * For stocks: returns all 30-second history points recorded today from
 * StockPriceHistory. Sorted ascending by timestamp.
 *
 * For mutual funds: MFs have no intraday history. Returns today's NAV from
 * DailyPrice (if already snapshotted) or an empty series, so the caller can
 * gracefully render a flat line or "no intraday data" message.
 */
const get1DChart = async (asset) => {
  if (asset.assetType === 'MUTUAL_FUND') {
    // MFs do not have intraday history — return today's daily NAV if available
    const today = todayIST();
    const record = await DailyPrice.findOne({
      ticker: asset.ticker,
      date: today,
    }).lean();

    const points = record
      ? [{ timestamp: `${today}T00:00:00.000Z`, price: record.closePrice }]
      : [];

    return {
      ticker: asset.ticker,
      assetType: asset.assetType,
      range: '1D',
      granularity: 'daily',
      points,
    };
  }

  // STOCK — fetch today's 30-second ticks
  const today = todayIST();
  const from = istDayStartUTC(today);
  const to = istDayEndUTC(today);

  const docs = await StockPriceHistory.find({
    ticker: asset.ticker,
    timestamp: { $gte: from, $lt: to },
  })
    .sort({ timestamp: 1 })
    .lean();

  const points = docs.map((d) => ({
    timestamp: d.timestamp.toISOString(),
    price: d.price,
    change: d.change,
    changePercent: d.changePercent,
  }));

  return {
    ticker: asset.ticker,
    assetType: asset.assetType,
    range: '1D',
    granularity: '30s',
    points,
  };
};

/**
 * getDailyChart(asset, range)
 *
 * Returns daily closing prices from DailyPrice for the requested lookback window.
 * Applies to both STOCK (closing prices) and MUTUAL_FUND (daily NAVs).
 * Points are sorted ascending by date.
 */
const getDailyChart = async (asset, range) => {
  const daysBack = RANGE_DAYS[range];
  const fromDate = daysAgoIST(daysBack);
  const toDate = todayIST();

  const docs = await DailyPrice.find({
    ticker: asset.ticker,
    date: { $gte: fromDate, $lte: toDate },
  })
    .sort({ date: 1 })
    .lean();

  const points = docs.map((d) => ({
    timestamp: `${d.date}T00:00:00.000Z`,
    price: d.closePrice,
  }));

  return {
    ticker: asset.ticker,
    assetType: asset.assetType,
    range,
    granularity: 'daily',
    points,
  };
};

module.exports = { getChart };
