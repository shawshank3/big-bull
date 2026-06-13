/**
 * Portfolio Service
 *
 * Computes portfolio holdings and summary entirely from raw transaction data.
 * NO derived totals are stored in MongoDB — everything is calculated on demand.
 *
 * Currency: all monetary values are in ₹ (Indian Rupees).
 */
'use strict';

const transactionService = require('../transaction/transaction.service');
const walletService = require('../wallet/wallet.service');
const redis = require('../../shared/redis');

/**
 * computeHoldings(userId)
 *
 * Aggregates raw transaction holdings, enriches each position with a live price
 * from Redis (key: `price:<ticker>`), and appends portfolio-weight per holding.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {Promise<Array>} Enriched holding objects:
 *   {
 *     assetId, netQuantity, totalBuyQty, totalBuyCost, avgCostBasis,
 *     asset: { ticker, name, assetType, exchange, sector },
 *     currentPrice, currentValue, totalInvested,
 *     unrealisedPnL, unrealisedPnLPercent, portfolioWeight
 *   }
 */
const computeHoldings = async (userId) => {
  const rawHoldings = await transactionService.aggregateHoldings(userId);

  // Fetch live prices from Redis in parallel
  const enriched = await Promise.all(
    rawHoldings.map(async (holding) => {
      const ticker = holding.asset.ticker;

      // Attempt Redis cache lookup — falls back to basePrice on miss
      let currentPrice = holding.asset.basePrice;
      try {
        const cached = await redis.get('price:' + ticker);
        if (cached !== null) {
          const parsed = JSON.parse(cached);
          currentPrice = parsed.price;
        }
      } catch (_err) {
        // Redis unavailable or JSON parse error — use basePrice silently
      }

      const currentValue = holding.netQuantity * currentPrice;
      const totalInvested = holding.totalBuyCost;
      const unrealisedPnL = currentValue - totalInvested;
      const unrealisedPnLPercent = totalInvested > 0 ? (unrealisedPnL / totalInvested) * 100 : 0;

      return {
        assetId: holding.assetId,
        netQuantity: holding.netQuantity,
        totalBuyQty: holding.totalBuyQty,
        totalBuyCost: holding.totalBuyCost,
        avgCostBasis: holding.avgCostBasis,
        asset: {
          ticker: holding.asset.ticker,
          name: holding.asset.name,
          assetType: holding.asset.assetType,
          exchange: holding.asset.exchange,
          sector: holding.asset.sector,
        },
        currentPrice,
        currentValue,
        totalInvested,
        unrealisedPnL,
        unrealisedPnLPercent,
        // portfolioWeight added below once we know the total
      };
    })
  );

  // Total portfolio value across all positions
  const totalPortfolioValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);

  // Append portfolio weight to each holding
  enriched.forEach((holding) => {
    holding.portfolioWeight =
      totalPortfolioValue > 0 ? (holding.currentValue / totalPortfolioValue) * 100 : 0;
  });

  return enriched;
};

/**
 * computeSummary(userId)
 *
 * Returns a high-level portfolio summary for the given user.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {Promise<object>}
 *   {
 *     totalInvested, currentValue, totalPnL, totalPnLPercent,
 *     holdingCount, cashBalance, currency
 *   }
 */
const computeSummary = async (userId) => {
  const [holdings, wallet] = await Promise.all([
    computeHoldings(userId),
    walletService.getBalance(userId).catch(() => ({ balance: 0 })),
  ]);

  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = currentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalPnL,
    totalPnLPercent,
    holdingCount: holdings.length,
    cashBalance: wallet.balance,
    currency: 'INR',
  };
};

module.exports = {
  computeHoldings,
  computeSummary,
};
