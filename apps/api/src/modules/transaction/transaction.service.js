/**
 * Transaction Service
 * Core business logic for order execution and portfolio aggregation.
 *
 * ⚠️  SOURCE OF TRUTH: All portfolio calculations derive from raw Transaction
 *     documents. Derived totals are NEVER stored — they are computed here on
 *     demand via aggregateHoldings().
 *
 * Currency: all monetary values are in ₹ (Indian Rupees).
 */
const mongoose = require('mongoose');
const Transaction = require('./transaction.model');
const Asset = require('../asset/asset.model');
const MarketState = require('../market/marketState.model');
const AppError = require('../../shared/AppError');
const walletService = require('../wallet/wallet.service');
const redis = require('../../shared/redis');

/**
 * resolveExecutionPrice(assetId)
 *
 * Resolves the server-side execution price for an asset.
 *
 * Priority (three-tier chain — Phase 2):
 *   1. Redis `price:<ticker>` — written by the MSE BullMQ worker every 30s (TTL 60s)
 *   2. MarketState.lastPrice  — durable MongoDB record; survives restarts / Redis flushes
 *   3. Asset.basePrice        — seed value used only when no runtime price exists yet
 *
 * @param {string|import('mongoose').Types.ObjectId} assetId
 * @returns {Promise<{ asset: object, pricePerUnit: number }>}
 * @throws {AppError} 404 if the asset does not exist in the catalog
 */
const resolveExecutionPrice = async (assetId) => {
  const asset = await Asset.findById(assetId).lean();
  if (!asset) {
    throw new AppError(`Asset not found: ${assetId}`, 404);
  }

  // Start with seed price as last-resort fallback
  let pricePerUnit = asset.basePrice;

  // Tier 1 — Redis (fastest, most current)
  try {
    const cached = await redis.get(`price:${asset.ticker}`);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      const redisPrice = parsed.price ?? parsed;
      if (typeof redisPrice === 'number' && redisPrice > 0) {
        return { asset, pricePerUnit: redisPrice };
      }
    }
  } catch (_) {
    /* Redis unavailable — continue to next tier */
  }

  // Tier 2 — MarketState (durable, survives Redis flush / server restart)
  try {
    const state = await MarketState.findOne({ ticker: asset.ticker }).lean();
    if (state && typeof state.lastPrice === 'number' && state.lastPrice > 0) {
      pricePerUnit = state.lastPrice;
    }
  } catch (_) {
    /* MongoDB unavailable — basePrice fallback already set */
  }

  return { asset, pricePerUnit };
};

/**
 * aggregateHoldings(userId)
 *
 * Computes current holdings for a user by aggregating all their transactions.
 * Only returns assets where netQuantity > 0 (active positions).
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {Promise<Array>} Array of holding objects:
 *   { assetId, netQuantity, totalBuyQty, totalBuyCost, avgCostBasis, asset }
 */
const aggregateHoldings = async (userId) => {
  const holdings = await Transaction.aggregate([
    // ── Stage 1: Filter to this user's transactions ───────────────────────
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },

    // ── Stage 2: Group by asset, accumulate BUY/SELL quantities and cost ──
    {
      $group: {
        _id: '$assetId',
        totalBuyQty: {
          $sum: {
            $cond: [{ $eq: ['$transactionType', 'BUY'] }, '$quantity', 0],
          },
        },
        totalSellQty: {
          $sum: {
            $cond: [{ $eq: ['$transactionType', 'SELL'] }, '$quantity', 0],
          },
        },
        // Total amount spent on BUY orders (quantity × pricePerUnit for BUY only)
        totalBuyCost: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', 'BUY'] },
              { $multiply: ['$quantity', '$pricePerUnit'] },
              0,
            ],
          },
        },
      },
    },

    // ── Stage 3: Derive netQuantity, avgCostBasis, and adjusted totalBuyCost ─
    {
      $addFields: {
        assetId: '$_id',
        netQuantity: { $subtract: ['$totalBuyQty', '$totalSellQty'] },
        // Guard against division by zero (totalBuyQty should never be 0 here
        // but we protect defensively)
        avgCostBasis: {
          $cond: [{ $gt: ['$totalBuyQty', 0] }, { $divide: ['$totalBuyCost', '$totalBuyQty'] }, 0],
        },
      },
    },

    // ── Stage 3b: Recompute totalBuyCost as cost of CURRENTLY HELD shares ─
    // Using raw totalBuyCost (all historical buys) causes totalInvested to
    // grow on every buy/sell cycle. Instead, totalBuyCost should represent
    // only the cost basis of the net position still held:
    //   adjustedTotalBuyCost = avgCostBasis × netQuantity
    {
      $addFields: {
        totalBuyCost: { $multiply: ['$avgCostBasis', '$netQuantity'] },
      },
    },

    // ── Stage 4: Keep only active holdings (net position > 0) ─────────────
    {
      $match: { netQuantity: { $gt: 0 } },
    },

    // ── Stage 5: Join with Asset collection for asset metadata ────────────
    {
      $lookup: {
        from: 'assets',
        localField: 'assetId',
        foreignField: '_id',
        as: 'asset',
      },
    },

    // Unwrap the single-element array produced by $lookup
    {
      $unwind: {
        path: '$asset',
        preserveNullAndEmptyArrays: false,
      },
    },

    // ── Stage 6: Clean up the output shape ───────────────────────────────
    {
      $project: {
        _id: 0,
        assetId: 1,
        netQuantity: 1,
        totalBuyQty: 1,
        totalBuyCost: 1,
        avgCostBasis: 1,
        asset: 1,
      },
    },
  ]);

  return holdings;
};

/**
 * executeOrder(userId, orderData)
 *
 * Places a BUY or SELL order atomically.
 *  - BUY : checks wallet balance, debits total cost (quantity × price + fees)
 *  - SELL: checks sufficient holdings, credits proceeds (quantity × price − fees)
 *
 * The execution price is ALWAYS resolved server-side from Redis (authoritative
 * 30 s MSE tick price) with a fallback to asset.basePrice. Any pricePerUnit
 * value supplied by the client is intentionally discarded — the client has no
 * authority over the price at which an order executes.
 *
 * All writes (Transaction insert + wallet update) happen inside a single
 * MongoDB session/transaction so they are all-or-nothing.
 *
 * @param {string} userId    - MongoDB ObjectId string of the acting user
 * @param {object} orderData - Validated order payload from orderSchema
 * @returns {Promise<import('mongoose').Document>} the created Transaction document
 * @throws {AppError} 400 for invalid assetId, insufficient holdings, or insufficient funds
 * @throws {AppError} 404 if the asset does not exist
 */
const executeOrder = async (userId, orderData) => {
  const { assetId, transactionType, quantity, fees = 0 } = orderData;

  // ── Validate assetId is a proper ObjectId ──────────────────────────────
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw new AppError('Invalid assetId', 400);
  }

  // ── Resolve execution price from Redis / asset catalog ────────────────
  const { pricePerUnit } = await resolveExecutionPrice(assetId);

  // ── Pre-flight checks ──────────────────────────────────────────────────
  if (transactionType === 'SELL') {
    // Ensure the user actually holds enough of this asset
    const holdings = await aggregateHoldings(userId);
    const holding = holdings.find((h) => h.assetId.toString() === assetId.toString());

    const heldQty = holding ? holding.netQuantity : 0;

    if (heldQty < quantity) {
      const ticker = holding?.asset?.ticker ?? assetId;
      throw new AppError(`Insufficient holdings. You hold ${heldQty} units of ${ticker}`, 400);
    }
  }

  if (transactionType === 'BUY') {
    const totalCost = quantity * pricePerUnit + fees;
    const wallet = await walletService.getBalance(userId);

    if (wallet.balance < totalCost) {
      throw new AppError('Insufficient wallet balance', 400);
    }
  }

  // ── Atomic write: Transaction record + wallet update ──────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Store the server-resolved pricePerUnit
    const txData = {
      userId,
      assetId,
      transactionType,
      quantity,
      pricePerUnit,
      fees,
      executedAt: new Date(),
    };
    if (orderData.notes) txData.notes = orderData.notes;

    const [tx] = await Transaction.create([txData], { session });

    if (transactionType === 'BUY') {
      const totalCost = quantity * pricePerUnit + fees;
      await walletService.debit(userId, totalCost, session);
    } else {
      // SELL: credit sale proceeds minus fees
      const proceeds = quantity * pricePerUnit - fees;
      await walletService.credit(userId, proceeds, session);
    }

    await session.commitTransaction();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * getTransactionHistory(userId, { page, limit })
 *
 * Returns a paginated, reverse-chronological list of a user's transactions.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number }} options
 * @returns {Promise<{ transactions: Array, pagination: object }>}
 */
const getTransactionHistory = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ userId }).sort({ executedAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments({ userId }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  aggregateHoldings,
  executeOrder,
  getTransactionHistory,
};
