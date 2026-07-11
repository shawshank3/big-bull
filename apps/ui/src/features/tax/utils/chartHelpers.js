/**
 * Chart data builders for the Tax feature visualisations.
 */

/**
 * buildGainsVsLossesData
 *
 * Builds chart data for the Harvesting page — realized gains vs harvestable
 * losses (threshold-filtered). Used by GainsVsLossesChart on TaxHarvesting.
 *
 * Fixed 6 bars always shown (zero values render as a flat line at 0):
 *  1. STCG Gains          → green  (positive = gain, negative = net STCG loss)
 *  2. LTCG Gains          → blue   (positive = gain, negative = net LTCG loss)
 *  3. Intraday            → teal if ≥ 0, orange if < 0 (single merged bar)
 *  4. Delivery Harv. Loss → red    (always negative or zero)
 *  5. Intraday Harv. Loss → amber  (always negative or zero)
 *  6. After Full Harvest  → purple (always shown, can be negative)
 *
 * @param {object} summary                  - TaxSummary DTO
 * @param {Array}  opportunities            - Delivery HarvestOpportunity[]
 * @param {Array}  intradayOpportunities    - Intraday HarvestOpportunity[]
 * @returns {Array} Chart data entries — always exactly 6 entries
 */
export function buildGainsVsLossesData(
  summary = {},
  opportunities = [],
  intradayOpportunities = []
) {
  const stcgGains = summary.totalSTCG ?? 0;
  const ltcgGains = summary.totalLTCG ?? 0;
  const totalIntraday = summary.totalIntraday ?? 0;

  const deliveryHarvestableLoss = opportunities.reduce((sum, opp) => sum + opp.unrealizedLoss, 0);
  const intradayHarvestableLoss = intradayOpportunities.reduce(
    (sum, opp) => sum + opp.unrealizedIntradayLoss,
    0
  );

  const netPosition =
    stcgGains + ltcgGains + totalIntraday - deliveryHarvestableLoss - intradayHarvestableLoss;

  return [
    {
      name: 'STCG Gains',
      value: stcgGains,
      fill: '#22c55e',
    },
    {
      name: 'LTCG Gains',
      value: ltcgGains,
      fill: '#3b82f6',
    },
    {
      // Single intraday bar — color reflects sign
      name: 'Intraday',
      value: totalIntraday,
      fill: totalIntraday < 0 ? '#f97316' : '#14b8a6',
    },
    {
      name: 'Delivery Harv. Loss',
      value: -deliveryHarvestableLoss,
      fill: '#ef4444',
    },
    {
      name: 'Intraday Harv. Loss',
      value: -intradayHarvestableLoss,
      fill: '#f59e0b',
    },
    {
      name: 'After Full Harvest',
      value: netPosition,
      fill: '#8b5cf6',
    },
  ];
}

/**
 * buildFYOverviewData
 *
 * Builds chart data for the Tax Center page — the full portfolio picture
 * with NO threshold filtering. Used by FYOverviewChart.
 *
 * Fixed 6 bars always shown (zero values render as a flat line at 0):
 *  1. STCG Gains      → green  (realized STCG, can be negative = net STCG loss)
 *  2. LTCG Gains      → blue   (realized LTCG, can be negative = net LTCG loss)
 *  3. Intraday        → teal if ≥ 0, orange if < 0 (single merged bar)
 *  4. Unrealized Gain → lime   (always positive or zero)
 *  5. Unrealized Loss → red    (always negative or zero)
 *  6. Net Position    → purple (always shown, can be negative)
 *
 * @param {object} overview - FYOverview DTO from toFYOverviewDTO
 * @returns {Array} Chart data entries — always exactly 6 entries
 */
export function buildFYOverviewData(overview = {}) {
  const stcgGains = overview.totalSTCG ?? 0;
  const ltcgGains = overview.totalLTCG ?? 0;
  const totalIntraday = overview.totalIntraday ?? 0;
  const totalUnrealizedGain = overview.totalUnrealizedGain ?? 0;
  const totalUnrealizedLoss = overview.totalUnrealizedLoss ?? 0;
  // netPosition comes pre-computed from the backend/SSE patch; fall back to local calc
  const netPosition =
    overview.netPosition ??
    stcgGains + ltcgGains + totalIntraday + totalUnrealizedGain - totalUnrealizedLoss;

  return [
    {
      name: 'STCG Gains',
      value: stcgGains,
      fill: '#22c55e',
    },
    {
      name: 'LTCG Gains',
      value: ltcgGains,
      fill: '#3b82f6',
    },
    {
      // Single intraday bar — color reflects sign
      name: 'Intraday',
      value: totalIntraday,
      fill: totalIntraday < 0 ? '#f97316' : '#14b8a6',
    },
    {
      name: 'Unrealized Gain',
      value: totalUnrealizedGain,
      fill: '#84cc16',
    },
    {
      name: 'Unrealized Loss',
      value: -totalUnrealizedLoss,
      fill: '#ef4444',
    },
    {
      name: 'Net Position',
      value: netPosition,
      fill: '#8b5cf6',
    },
  ];
}
