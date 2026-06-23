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
const {
  ASSET_TYPES,
  CHART_RANGES,
  CHART_BASELINE_OFFSETS,
  HTTP_STATUS,
} = require('../../shared/constants');
const DailyPrice = require('./dailyPrice.model');
const AppError = require('../../shared/AppError');

// ─── Range configuration ─────────────────────────────────────────────────────

/**
 * Number of calendar days to look back for each multi-day range.
 * 1D is handled separately (intraday minutes, not days back).
 */
const RANGE_DAYS = {
  [CHART_RANGES.ONE_WEEK]: 7,
  [CHART_RANGES.ONE_MONTH]: 30,
  [CHART_RANGES.THREE_MONTHS]: 90,
  [CHART_RANGES.ONE_YEAR]: 365,
};

const VALID_RANGES = Object.values(CHART_RANGES);

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
 * Look up the baseline (reference) closing price for the given range.
 *
 * The baseline is the most recent DailyPrice whose date is on or before the
 * range's lookback target (today − CHART_BASELINE_OFFSETS[range] calendar
 * days). Concretely:
 *   - 1D → yesterday's close
 *   - 1W → close from 7 days ago (or the most recent prior close if 7-days-
 *          ago itself has no record, e.g. weekend / market holiday)
 *   - 1M / 3M / 1Y → analogous behaviour
 *
 * The chart UI uses this value to draw a horizontal baseline and to show the
 * +/- delta vs. that historical close.
 *
 * @returns {Promise<{ price: number, date: string } | null>} Null when no
 *          prior close exists yet (cold-start / new asset).
 */
const getBaselineForRange = async (asset, range) => {
  const offsetDays = CHART_BASELINE_OFFSETS[range];
  if (!offsetDays) return null;

  const targetDate = daysAgoIST(offsetDays);
  const doc = await DailyPrice.findOne({
    ticker: asset.ticker,
    date: { $lte: targetDate },
  })
    .sort({ date: -1 })
    .lean();

  if (!doc) return null;
  return { price: doc.closePrice, date: doc.date };
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
 *   ],
 *   baseline: { price: number, date: string } | null  // reference close used
 *                                                       // for +/- delta and the
 *                                                       // chart's horizontal
 *                                                       // baseline line
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
    throw new AppError(
      `Invalid range "${range}". Valid values: ${VALID_RANGES.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const asset = await Asset.findOne({ ticker: upperTicker }).lean();
  if (!asset) {
    throw new AppError(`Asset not found: ${ticker}`, HTTP_STATUS.NOT_FOUND);
  }

  // ── 1D range ────────────────────────────────────────────────────────────
  if (upperRange === CHART_RANGES.ONE_DAY) {
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
  // Resolve the previous-day close once for both branches; used by the
  // chart UI as the baseline reference line and the +/- delta anchor.
  const baseline = await getBaselineForRange(asset, CHART_RANGES.ONE_DAY);

  if (asset.assetType === ASSET_TYPES.MUTUAL_FUND) {
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
      range: CHART_RANGES.ONE_DAY,
      granularity: 'daily',
      points,
      baseline,
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
    range: CHART_RANGES.ONE_DAY,
    granularity: '30s',
    points,
    baseline,
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

  const [docs, baseline] = await Promise.all([
    DailyPrice.find({
      ticker: asset.ticker,
      date: { $gte: fromDate, $lte: toDate },
    })
      .sort({ date: 1 })
      .lean(),
    getBaselineForRange(asset, range),
  ]);

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
    baseline,
  };
};

module.exports = { getChart };
