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
