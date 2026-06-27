/**
 * Price Simulation Utilities
 *
 * Pure helpers for the Market Simulation Engine (MSE) and the daily-price
 * backfill / rollover workers. Centralises the random-walk math that was
 * previously duplicated between `mseWorker.js` and `dailyPriceService.js`.
 *
 * Design rules:
 *   - Pure functions only — no I/O, no side effects.
 *   - No knowledge of Mongo / Redis / BullMQ.
 *   - Caller is responsible for clamping precision and persisting the result.
 */

/**
 * Box-Muller transform — returns a single standard-normal sample (μ=0, σ=1).
 *
 * @returns {number}
 */
const gaussianNoise = () => {
  const u1 = 1 - Math.random(); // (0, 1] to keep log defined
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/**
 * Advance a price by one trading-day random-walk step using the simplified
 * MSE formula (no market sentiment / sector trend — used for daily NAV
 * rollovers and historical day-by-day backfill).
 *
 *   Price_next = Price_prev × (1 + volatility × N)
 *
 * Clamped to a ₹1 floor and rounded to 2 decimals.
 *
 * @param {number} prevPrice    The previous day's closing price (₹).
 * @param {number} volatility   Asset's volatility multiplier (0..1).
 * @returns {number} The next day's price (₹).
 */
const nextDayPrice = (prevPrice, volatility) =>
  Math.max(1, parseFloat((prevPrice * (1 + volatility * gaussianNoise())).toFixed(2)));

/**
 * Volatility scaling factor for one 30-second intraday tick.
 *
 * The raw `Asset.volatility` is calibrated against a daily timescale.  A 30-second
 * tick is 1/2880 of a day, so its noise amplitude must be much smaller to keep
 * the cumulative day-over-day drift in the same range as `nextDayPrice`.
 *
 * The 0.25 value is the empirical scale used by the existing intraday backfill
 * and reproduces the smooth, natural-looking 1D charts the rest of the system
 * is designed around.
 */
const INTRADAY_VOL_SCALE = 0.25;

/**
 * Volatility scaling factor for the 1-second SSE micro-tick.
 *
 * Derived as `INTRADAY_VOL_SCALE / √30` so the cumulative drift of 30
 * consecutive 1-second micro-ticks is roughly equal to one 30-second
 * intraday tick.  Keeps the visible price wobble small between the
 * authoritative 30s worker writes.
 */
const MICRO_VOL_SCALE = 0.046;

/**
 * Advance a price by one 30-second intraday random-walk step.
 *
 *   Price_next = Price_prev × (1 + drift + (volatility × INTRADAY_VOL_SCALE) × N)
 *
 * `drift` is an optional additive bias — used by the live MSE worker to layer
 * MarketSentiment + SectorTrend on top of the walk.  When `drift = 0` this
 * function produces output statistically indistinguishable from the intraday
 * backfill, so the 1D chart looks the same whether a point came from the
 * cold-start backfill or from a live tick.
 *
 * Clamped to a ₹1 floor and rounded to 2 decimals.
 *
 * @param {number} prevPrice
 * @param {number} volatility   Asset's daily-calibrated volatility (0..1).
 * @param {number} [drift=0]    Pre-noise bias (sentiment + sector trend).
 * @returns {number}
 */
const nextIntradayPrice = (prevPrice, volatility, drift = 0) => {
  const delta = drift + volatility * INTRADAY_VOL_SCALE * gaussianNoise();
  return Math.max(1, parseFloat((prevPrice * (1 + delta)).toFixed(2)));
};

/**
 * Advance a price by one 1-second micro-tick.
 *
 *   Price_next = Price_prev × (1 + (volatility × MICRO_VOL_SCALE) × N)
 *
 * Used by the SSE live ticker between the authoritative 30s worker writes.
 * Carries no drift component — sentiment and sector trends are already baked
 * into the 30s tick the cache was seeded from.
 *
 * @param {number} prevPrice
 * @param {number} volatility
 * @returns {number}
 */
const nextMicroPrice = (prevPrice, volatility) => {
  const delta = volatility * MICRO_VOL_SCALE * gaussianNoise();
  return Math.max(1, parseFloat((prevPrice * (1 + delta)).toFixed(2)));
};

/**
 * Returns the current date as a YYYY-MM-DD string in IST (UTC+5:30).
 * Used to gate per-day idempotent operations like the MF NAV rollover.
 *
 * @returns {string} e.g. '2026-06-24'
 */
const todayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

module.exports = {
  gaussianNoise,
  nextDayPrice,
  nextIntradayPrice,
  nextMicroPrice,
  todayIST,
  INTRADAY_VOL_SCALE,
  MICRO_VOL_SCALE,
};
