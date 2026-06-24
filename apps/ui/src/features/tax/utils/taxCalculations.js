/**
 * Tax calculation utilities for the Tax Center feature.
 * Indian capital gains tax rates and computation helpers.
 */

export const STCG_RATE = 0.2;
export const LTCG_RATE = 0.125;
export const LTCG_EXEMPTION = 125000;

/**
 * Compute tax from STCG and LTCG amounts using Indian rates.
 * STCG: 20% flat on positive gains.
 * LTCG: 12.5% on amount exceeding ₹1,25,000 exemption.
 */
export function computeTax(totalSTCG, totalLTCG) {
  const stcgTax = totalSTCG > 0 ? totalSTCG * STCG_RATE : 0;
  const ltcgTax = totalLTCG > LTCG_EXEMPTION ? (totalLTCG - LTCG_EXEMPTION) * LTCG_RATE : 0;
  return stcgTax + ltcgTax;
}

/**
 * Computes harvesting metrics from the opportunities array.
 * @param {Array} opportunities - HarvestOpportunity[]
 * @returns {{ totalHarvestableLoss: number, potentialTaxSavings: number, stcgOffsets: number, ltcgOffsets: number }}
 */
export function computeHarvestingMetrics(opportunities = []) {
  let totalHarvestableLoss = 0;
  let potentialTaxSavings = 0;
  let stcgOffsets = 0;
  let ltcgOffsets = 0;

  for (const opp of opportunities) {
    totalHarvestableLoss += opp.unrealizedLoss;
    potentialTaxSavings += opp.estimatedSaving;

    if (opp.lossType === 'STCG') {
      stcgOffsets += opp.unrealizedLoss;
    } else if (opp.lossType === 'LTCG') {
      ltcgOffsets += opp.unrealizedLoss;
    }
  }

  return { totalHarvestableLoss, potentialTaxSavings, stcgOffsets, ltcgOffsets };
}

/**
 * Computes unrealized loss percentage for a harvesting opportunity.
 * @param {{ avgCostBasis: number, quantity: number, unrealizedLoss: number }} opportunity
 * @returns {number} Loss percentage (negative number)
 */
export function computeLossPercent(opportunity) {
  const totalCost = opportunity.avgCostBasis * opportunity.quantity;
  if (totalCost === 0) return 0;
  return (opportunity.unrealizedLoss / totalCost) * 100;
}
