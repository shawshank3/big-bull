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
const MarketState = require('../market/marketState.model');

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

  // Fetch live prices from Redis in parallel, with three-tier fallback
  const enriched = await Promise.all(
    rawHoldings.map(async (holding) => {
      const ticker = holding.asset.ticker;

      // Tier 1 — Redis (most current, TTL 60s)
      let currentPrice = null;
      try {
        const cached = await redis.get('price:' + ticker);
        if (cached !== null) {
          const parsed = JSON.parse(cached);
          const p = parsed.price ?? parsed;
          if (typeof p === 'number' && p > 0) currentPrice = p;
        }
      } catch (_) {
        /* Redis unavailable */
      }

      // Tier 2 — MarketState (durable MongoDB record)
      if (currentPrice === null) {
        try {
          const state = await MarketState.findOne({ ticker }).lean();
          if (state && typeof state.lastPrice === 'number' && state.lastPrice > 0) {
            currentPrice = state.lastPrice;
          }
        } catch (_) {
          /* MongoDB issue */
        }
      }

      // Tier 3 — seed price
      if (currentPrice === null) {
        currentPrice = holding.asset.basePrice;
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
