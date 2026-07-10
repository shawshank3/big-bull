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
const AppError = require('../../shared/AppError');
const walletService = require('../wallet/wallet.service');
const { resolveAssetPrice } = require('../market/market.service');
const { roundRupee, moneyAdd, moneySubtract, moneyMultiply } = require('../../shared/money');
const { TRANSACTION_TYPES, ASSET_TYPES } = require('../../shared/constants');

/**
 * resolveExecutionPrice(assetId)
 *
 * Resolves the server-side execution price for an asset using the
 * asset-aware resolver in `market.service`:
 *
 *   STOCK:        three-tier chain → Redis `price:<ticker>` (TTL 60s) →
 *                 MarketState.lastPrice → Asset.basePrice
 *   MUTUAL_FUND:  today's DailyPrice (chart's last point) → most recent
 *                 DailyPrice → Asset.basePrice
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

  const pricePerUnit = await resolveAssetPrice(asset);
  return { asset, pricePerUnit };
};

/**
 * aggregateHoldings(userId)
 *
 * Computes current holdings for a user using FIFO lot-matching against all
 * their transactions. Only returns assets where netQuantity > 0 (active
 * positions).
 *
 * Why FIFO instead of a simple group-and-average?
 * ─────────────────────────────────────────────────
 * A naive aggregation sums ALL historical buy costs and quantities, which
 * produces incorrect avgCostBasis when a user fully sells a position and
 * later re-buys. The old (already sold) buy transactions contaminate the
 * average. FIFO correctly consumes BUY lots against SELL transactions in
 * chronological order, so the remaining (unmatched) lots accurately reflect
 * the cost basis of the current position.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {Promise<Array>} Array of holding objects:
 *   { assetId, netQuantity, totalBuyQty, totalBuyCost, avgCostBasis, asset }
 */
const aggregateHoldings = async (userId) => {
  // Step 1: Fetch all transactions for this user, sorted chronologically
  const transactions = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ executedAt: 1 })
    .lean();

  if (transactions.length === 0) return [];

  // Step 2: Group transactions by assetId
  const txByAsset = {};
  for (const tx of transactions) {
    const key = tx.assetId.toString();
    if (!txByAsset[key]) txByAsset[key] = { buys: [], sells: [] };
    if (tx.transactionType === TRANSACTION_TYPES.BUY) {
      txByAsset[key].buys.push(tx);
    } else {
      txByAsset[key].sells.push(tx);
    }
  }

  // Step 3: For each asset, run FIFO matching to determine remaining lots
  const assetIdsWithHoldings = [];
  const holdingsMap = {};

  for (const [assetId, { buys, sells }] of Object.entries(txByAsset)) {
    // Create mutable lots from BUY transactions (already sorted by executedAt)
    const lots = buys.map((b) => ({
      remainingQty: b.quantity,
      pricePerUnit: b.pricePerUnit,
    }));

    // Consume lots in FIFO order against SELL transactions
    let lotIdx = 0;
    for (const sell of sells) {
      let sellRemaining = sell.quantity;
      while (sellRemaining > 0 && lotIdx < lots.length) {
        const lot = lots[lotIdx];
        if (lot.remainingQty <= 0) {
          lotIdx++;
          continue;
        }
        const matched = Math.min(lot.remainingQty, sellRemaining);
        lot.remainingQty -= matched;
        sellRemaining -= matched;
        if (lot.remainingQty <= 0) lotIdx++;
      }
    }

    // Sum up remaining (unmatched) lots → these form the current position
    let netQuantity = 0;
    let totalBuyCost = 0;
    let totalBuyQty = 0;

    for (const lot of lots) {
      if (lot.remainingQty > 0) {
        netQuantity += lot.remainingQty;
        totalBuyCost = moneyAdd(totalBuyCost, moneyMultiply(lot.remainingQty, lot.pricePerUnit));
        totalBuyQty += lot.remainingQty;
      }
    }

    // Only keep active holdings
    if (netQuantity > 0) {
      assetIdsWithHoldings.push(new mongoose.Types.ObjectId(assetId));
      holdingsMap[assetId] = {
        assetId: new mongoose.Types.ObjectId(assetId),
        netQuantity,
        totalBuyQty,
        totalBuyCost,
        avgCostBasis: totalBuyQty > 0 ? roundRupee(totalBuyCost / totalBuyQty) : 0,
      };
    }
  }

  if (assetIdsWithHoldings.length === 0) return [];

  // Step 4: Fetch asset metadata for active holdings
  const assets = await Asset.find({ _id: { $in: assetIdsWithHoldings } }).lean();

  const assetMap = {};
  for (const asset of assets) {
    assetMap[asset._id.toString()] = asset;
  }

  // Step 5: Assemble final holdings array
  const holdings = [];
  for (const [assetId, holding] of Object.entries(holdingsMap)) {
    const asset = assetMap[assetId];
    if (!asset) continue; // skip if asset was deleted from catalog

    holdings.push({
      ...holding,
      asset,
    });
  }

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
  const { asset, pricePerUnit } = await resolveExecutionPrice(assetId);

  // User-friendly display name for error messages (ticker for stocks, name for MFs)
  const assetDisplayName =
    asset?.assetType === ASSET_TYPES.MUTUAL_FUND
      ? (asset?.name ?? asset?.ticker ?? assetId)
      : (asset?.ticker ?? asset?.name ?? assetId);

  // ── Asset-type-specific quantity rules ────────────────────────────────
  // Stocks trade in whole units only; mutual funds support fractional units.
  if (asset?.assetType === ASSET_TYPES.STOCK && !Number.isInteger(quantity)) {
    throw new AppError(
      `Stock quantity must be a whole number. ${assetDisplayName} cannot be traded in fractional units.`,
      400
    );
  }

  // ── Pre-flight checks ──────────────────────────────────────────────────
  if (transactionType === TRANSACTION_TYPES.SELL) {
    // Ensure the user actually holds enough of this asset
    const holdings = await aggregateHoldings(userId);
    const holding = holdings.find((h) => h.assetId.toString() === assetId.toString());

    const heldQty = holding ? holding.netQuantity : 0;

    if (heldQty < quantity) {
      const shortBy = +(quantity - heldQty).toFixed(3);
      throw new AppError(
        `Insufficient holdings for ${assetDisplayName}. You are ${shortBy} units short.`,
        400
      );
    }
  }

  if (transactionType === TRANSACTION_TYPES.BUY) {
    const totalCost = moneyAdd(moneyMultiply(quantity, pricePerUnit), fees);
    const wallet = await walletService.getBalance(userId);

    if (wallet.balance < totalCost) {
      const shortBy = roundRupee(totalCost - wallet.balance).toFixed(2);
      throw new AppError(
        `Insufficient wallet balance to buy ${assetDisplayName}. You need ₹${shortBy} more.`,
        400
      );
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

    if (transactionType === TRANSACTION_TYPES.BUY) {
      const totalCost = moneyAdd(moneyMultiply(quantity, pricePerUnit), fees);
      await walletService.debit(userId, totalCost, session);
    } else {
      // SELL: credit sale proceeds minus fees
      const proceeds = moneySubtract(moneyMultiply(quantity, pricePerUnit), fees);
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
 * getTransactionHistory(userId, { page, limit, assetId })
 *
 * Returns a paginated, reverse-chronological list of a user's transactions.
 * Optionally filtered to a specific asset via assetId.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number, assetId?: string }} options
 * @returns {Promise<{ transactions: Array, pagination: object }>}
 */
const getTransactionHistory = async (userId, { page = 1, limit = 20, assetId } = {}) => {
  const skip = (page - 1) * limit;

  const filter = { userId };
  if (assetId && mongoose.Types.ObjectId.isValid(assetId)) {
    filter.assetId = new mongoose.Types.ObjectId(assetId);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ executedAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
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

/**
 * listTransactions(userId, { page, limit, filters, search, sort })
 *
 * Standardised paginated list with filters and search.
 * Used by POST /transactions/list.
 *
 * @param {string} userId
 * @param {object} options
 * @returns {Promise<{ transactions: Array, total: number }>}
 */
const listTransactions = async (
  userId,
  { page = 1, limit = 20, filters = {}, search = '', sort } = {}
) => {
  const skip = (page - 1) * limit;

  // Build filter query
  const query = { userId };
  if (filters.assetId && mongoose.Types.ObjectId.isValid(filters.assetId)) {
    query.assetId = new mongoose.Types.ObjectId(filters.assetId);
  }
  if (filters.transactionType) {
    query.transactionType = filters.transactionType;
  }

  // Date range filter on executedAt (inclusive). dateTo is treated as the
  // end of that calendar day so the range is intuitive for users picking a
  // single date or a [from, to] range from the UI calendar.
  if (filters.dateFrom || filters.dateTo) {
    const range = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!Number.isNaN(from.getTime())) range.$gte = from;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
    }
    if (Object.keys(range).length > 0) {
      query.executedAt = range;
    }
  }

  // Text search on notes field (if search term provided)
  if (search && search.trim()) {
    query.notes = { $regex: search.trim(), $options: 'i' };
  }

  // Build sort
  const allowedSortFields = ['executedAt', 'quantity', 'pricePerUnit', 'fees'];
  let sortObj = { executedAt: -1 }; // default
  if (sort && sort.field && allowedSortFields.includes(sort.field)) {
    sortObj = { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query),
  ]);

  return { transactions, total };
};

module.exports = {
  aggregateHoldings,
  executeOrder,
  getTransactionHistory,
  listTransactions,
};
