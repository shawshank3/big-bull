/**
 * Chart data builders for the Tax feature visualisations.
 */

/**
 * Builds chart data from tax summary and harvesting opportunities.
 * @param {object} summary - TaxSummary DTO
 * @param {Array} opportunities - HarvestOpportunity[]
 * @returns {Array} Chart data entries for the Gains vs Losses bar chart
 */
export function buildGainsVsLossesData(summary = {}, opportunities = []) {
  const totalHarvestableLoss = opportunities.reduce((sum, opp) => sum + opp.unrealizedLoss, 0);

  const stcgGains = summary.totalSTCG ?? 0;
  const ltcgGains = summary.totalLTCG ?? 0;
  const netPosition = stcgGains + ltcgGains - totalHarvestableLoss;

  return [
    { name: 'STCG Gains', value: stcgGains, fill: '#22c55e' },
    { name: 'LTCG Gains', value: ltcgGains, fill: '#3b82f6' },
    { name: 'Harvestable Losses', value: -totalHarvestableLoss, fill: '#ef4444' },
    { name: 'Net Position', value: netPosition, fill: '#8b5cf6' },
  ];
}
