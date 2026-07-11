/**
 * Chart data builders for the Tax feature visualisations.
 */

/**
 * Builds chart data from tax summary, delivery harvesting opportunities,
 * and intraday harvesting opportunities.
 *
 * Bars shown:
 *  - STCG Gains          → green  (positive)
 *  - LTCG Gains          → blue   (positive)
 *  - Intraday Gains      → teal   (positive when net intraday > 0)
 *  - Intraday Loss       → orange (negative when net intraday < 0)
 *  - Delivery Harv. Loss → red    (negative — delivery positions at a loss)
 *  - Intraday Harv. Loss → amber  (negative — open intraday positions at a loss)
 *  - Net Position        → purple (sum of all gains minus all harvestable losses)
 *
 * @param {object} summary                  - TaxSummary DTO
 * @param {Array}  opportunities            - Delivery HarvestOpportunity[]
 * @param {Array}  intradayOpportunities    - Intraday HarvestOpportunity[]
 * @returns {Array} Chart data entries
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

  const data = [];

  if (stcgGains !== 0) {
    data.push({ name: 'STCG Gains', value: stcgGains, fill: '#22c55e' });
  }

  if (ltcgGains !== 0) {
    data.push({ name: 'LTCG Gains', value: ltcgGains, fill: '#3b82f6' });
  }

  if (totalIntraday > 0) {
    data.push({ name: 'Intraday Gains', value: totalIntraday, fill: '#14b8a6' });
  } else if (totalIntraday < 0) {
    data.push({ name: 'Intraday Loss', value: totalIntraday, fill: '#f97316' });
  }

  if (deliveryHarvestableLoss > 0) {
    data.push({
      name: 'Delivery Harvesting Loss',
      value: -deliveryHarvestableLoss,
      fill: '#ef4444',
    });
  }

  if (intradayHarvestableLoss > 0) {
    data.push({
      name: 'Intraday Harvesting Loss',
      value: -intradayHarvestableLoss,
      fill: '#f59e0b',
    });
  }

  data.push({ name: 'Net Position', value: netPosition, fill: '#8b5cf6' });

  return data;
}
