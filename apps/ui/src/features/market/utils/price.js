/**
 * Price calculation utilities for market feature components.
 */

/**
 * Compute the absolute and percentage price change between the first and
 * last data points in a chart series.
 *
 * @param {Array<{price: number}>} points - Ordered chart data points.
 * @returns {{ delta: number, pct: number, up: boolean } | null}
 */
export const getPriceDelta = (points) => {
  if (!points || points.length < 2) return null;
  const first = points[0].price;
  const last = points[points.length - 1].price;
  const delta = last - first;
  const pct = first > 0 ? (delta / first) * 100 : 0;
  return { delta, pct, up: delta >= 0 };
};

/**
 * Compute the absolute and percentage price change between a baseline
 * reference price and the latest value. Used to anchor the chart's +/-
 * indicator to a historical close (e.g. previous-day close for 1D, the
 * close from N days ago for multi-day ranges) rather than to the first
 * point currently visible in the window.
 *
 * @param {number} latestPrice
 * @param {number} baselinePrice
 * @returns {{ delta: number, pct: number, up: boolean } | null}
 */
export const getBaselineDelta = (latestPrice, baselinePrice) => {
  if (
    typeof latestPrice !== 'number' ||
    typeof baselinePrice !== 'number' ||
    !isFinite(latestPrice) ||
    !isFinite(baselinePrice) ||
    baselinePrice <= 0
  ) {
    return null;
  }
  const delta = latestPrice - baselinePrice;
  const pct = (delta / baselinePrice) * 100;
  return { delta, pct, up: delta >= 0 };
};
