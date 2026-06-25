/**
 * Insights Service
 * Computes and caches platform-wide statistics in a single AppInsights document.
 * Stats are recomputed at most once every 5 minutes to avoid hammering the DB.
 */
const AppInsights = require('./insights.model');
const Asset = require('../asset/asset.model');
const User = require('../user/user.model');
const Transaction = require('../transaction/transaction.model');
const { ASSET_TYPES } = require('../../shared/constants');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * getInsights()
 *
 * Returns cached stats if fresh (< 5 min old), otherwise recomputes from
 * source collections, upserts the single AppInsights document, and returns it.
 *
 * @returns {Promise<{ stockCount, mutualFundCount, userCount, totalTrades }>}
 */
const getInsights = async () => {
  const existing = await AppInsights.findOne().lean();

  if (existing && existing.lastComputedAt) {
    const age = Date.now() - new Date(existing.lastComputedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return formatInsights(existing);
    }
  }

  // Recompute from source collections
  const [stockCount, mutualFundCount, userCount, totalTrades] = await Promise.all([
    Asset.countDocuments({ assetType: ASSET_TYPES.STOCK }),
    Asset.countDocuments({ assetType: ASSET_TYPES.MUTUAL_FUND }),
    User.countDocuments(),
    Transaction.countDocuments(),
  ]);

  const stats = { stockCount, mutualFundCount, userCount, totalTrades, lastComputedAt: new Date() };

  // Upsert: update the single document or create it if it doesn't exist
  await AppInsights.findOneAndUpdate({}, stats, { upsert: true, new: true });

  return formatInsights(stats);
};

const formatInsights = ({ stockCount, mutualFundCount, userCount, totalTrades }) => ({
  stockCount,
  mutualFundCount,
  userCount,
  totalTrades,
});

module.exports = { getInsights };
