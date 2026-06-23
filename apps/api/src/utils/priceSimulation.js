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
  todayIST,
};
