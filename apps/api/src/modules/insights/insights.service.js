/**
 * Insights Service
 * Computes platform-wide statistics directly from source collections every time.
 * No caching to ensure fresh data on every fetch.
 */
const Asset = require('../asset/asset.model');
const User = require('../user/user.model');
const Transaction = require('../transaction/transaction.model');
const { ASSET_TYPES } = require('../../shared/constants');

/**
 * getInsights()
 *
 * Returns fresh statistics computed directly from source collections.
 *
 * @returns {Promise<{ stockCount, mutualFundCount, userCount, totalTrades }>}
 */
const getInsights = async () => {
  // Compute directly from source collections every time
  const [stockCount, mutualFundCount, userCount, totalTrades] = await Promise.all([
    Asset.countDocuments({ assetType: ASSET_TYPES.STOCK }),
    Asset.countDocuments({ assetType: ASSET_TYPES.MUTUAL_FUND }),
    User.countDocuments(),
    Transaction.countDocuments(),
  ]);

  return { stockCount, mutualFundCount, userCount, totalTrades };
};

module.exports = { getInsights };
