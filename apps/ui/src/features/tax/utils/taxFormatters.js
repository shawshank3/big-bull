/**
 * Tax-specific formatting and data transformation utilities.
 */

/**
 * Returns the current Indian Financial Year start year.
 * Jan–Mar belongs to the previous FY (e.g., Feb 2026 → FY 2025).
 */
export function getCurrentFY() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
  const year = now.getFullYear();
  return month < 3 ? year - 1 : year;
}

/**
 * Formats a FY start year into a readable label.
 * @param {number} year - FY start year (e.g. 2025)
 * @returns {string} e.g. "FY 2025-26"
 */
export function formatFYLabel(year) {
  return `FY ${year}-${String(year + 1).slice(2)}`;
}

/**
 * Generates an array of FY options (current + 3 previous years).
 * @returns {number[]}
 */
export function generateFYOptions() {
  const currentYear = getCurrentFY();
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
}

/**
 * Groups harvesting opportunities by sector.
 * @param {Array} opportunities - HarvestOpportunity[]
 * @returns {Object} Map of sector → { totalLoss, count, topLoser }
 */
export function groupBySector(opportunities = []) {
  return opportunities.reduce((acc, opp) => {
    const sector = opp.sector || 'Other';
    if (!acc[sector]) {
      acc[sector] = { totalLoss: 0, count: 0, topLoser: null };
    }
    acc[sector].totalLoss += opp.unrealizedLoss;
    acc[sector].count += 1;
    if (!acc[sector].topLoser || opp.unrealizedLoss > acc[sector].topLoser.unrealizedLoss) {
      acc[sector].topLoser = opp;
    }
    return acc;
  }, {});
}

/**
 * Computes background opacity based on loss relative to max loss.
 * Higher loss = more intense red.
 * @param {number} loss
 * @param {number} maxLoss
 * @returns {number} Opacity value between 0.15 and 0.9
 */
export function getLossIntensity(loss, maxLoss) {
  if (maxLoss <= 0) return 0.1;
  return Math.max(0.15, Math.min(0.9, loss / maxLoss));
}
