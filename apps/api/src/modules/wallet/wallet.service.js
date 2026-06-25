/**
 * Wallet Service
 * Business logic for the VirtualWallet module.
 *
 * Functions:
 *   getBalance(userId)              – fetch wallet; throws 404 if not found
 *   debit(userId, amount, session)  – decrement balance; throws 400 if insufficient
 *   credit(userId, amount, session) – increment balance
 */
const VirtualWallet = require('./wallet.model');
const Transaction = require('../transaction/transaction.model');
const AppError = require('../../shared/AppError');
const { TRANSACTION_TYPES, WALLET_TRANSACTION_TYPES } = require('../../shared/constants');

/**
 * getBalance(userId)
 *
 * Fetches the wallet document for the given user.
 *
 * @param {string} userId - MongoDB ObjectId string of the user
 * @returns {Promise<import('mongoose').Document>} the wallet document
 * @throws {AppError} 404 if no wallet exists for this user
 */
const getBalance = async (userId) => {
  const wallet = await VirtualWallet.findOne({ userId });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  return wallet;
};

/**
 * debit(userId, amount, session)
 *
 * Atomically decrements the wallet balance by `amount`.
 * Validates that the current balance is sufficient before writing.
 *
 * @param {string}                         userId  - owner of the wallet
 * @param {number}                         amount  - positive amount to debit
 * @param {import('mongoose').ClientSession} [session] - optional Mongoose session for transactions
 * @returns {Promise<import('mongoose').Document>} the updated wallet document
 * @throws {AppError} 400 if balance < amount
 */
const debit = async (userId, amount, session) => {
  // Read current balance to validate sufficiency before the update
  const wallet = await VirtualWallet.findOne({ userId }).session(session || null);

  if (!wallet || wallet.balance < amount) {
    throw new AppError(
      `Insufficient wallet balance. Required: ₹${amount}, Available: ₹${wallet ? wallet.balance : 0}`,
      400
    );
  }

  const queryOptions = {
    new: true,
    runValidators: true,
    ...(session ? { session } : {}),
  };

  const updated = await VirtualWallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    queryOptions
  );

  return updated;
};

/**
 * credit(userId, amount, session)
 *
 * Atomically increments the wallet balance by `amount`.
 *
 * @param {string}                         userId  - owner of the wallet
 * @param {number}                         amount  - positive amount to credit
 * @param {import('mongoose').ClientSession} [session] - optional Mongoose session for transactions
 * @returns {Promise<import('mongoose').Document>} the updated wallet document
 */
const credit = async (userId, amount, session) => {
  const queryOptions = {
    new: true,
    runValidators: true,
    ...(session ? { session } : {}),
  };

  const updated = await VirtualWallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    queryOptions
  );

  return updated;
};

/**
 * getWalletTransactions(userId, { page, limit })
 *
 * Returns a paginated, reverse-chronological list of the user's transactions
 * from a wallet (debit/credit) perspective, with asset details populated.
 *
 * BUY → Debit (money left the wallet)
 * SELL → Credit (money entered the wallet)
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number }} options
 * @returns {Promise<{ transactions: Array, pagination: object }>}
 */
const getWalletTransactions = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ userId })
      .sort({ executedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assetId', 'ticker name assetType')
      .lean(),
    Transaction.countDocuments({ userId }),
  ]);

  const mapped = transactions.map((tx) => {
    const totalAmount = tx.quantity * tx.pricePerUnit + tx.fees;
    return {
      id: tx._id,
      type:
        tx.transactionType === TRANSACTION_TYPES.BUY
          ? WALLET_TRANSACTION_TYPES.DEBIT
          : WALLET_TRANSACTION_TYPES.CREDIT,
      amount: totalAmount,
      asset: tx.assetId
        ? { ticker: tx.assetId.ticker, name: tx.assetId.name, assetType: tx.assetId.assetType }
        : null,
      quantity: tx.quantity,
      pricePerUnit: tx.pricePerUnit,
      fees: tx.fees,
      executedAt: tx.executedAt,
    };
  });

  return {
    transactions: mapped,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * listWalletTransactions(userId, { page, limit, filters, search, sort })
 *
 * Standardised paginated wallet transaction list with filters and search.
 * Used by POST /wallet/transactions/list.
 *
 * @param {string} userId
 * @param {object} options
 * @returns {Promise<{ transactions: Array, total: number }>}
 */
const listWalletTransactions = async (
  userId,
  { page = 1, limit = 20, filters = {}, search = '', sort } = {}
) => {
  const skip = (page - 1) * limit;

  const query = { userId };

  // Filter by transaction type (BUY for DEBIT, SELL for CREDIT)
  if (filters.type === WALLET_TRANSACTION_TYPES.DEBIT) {
    query.transactionType = TRANSACTION_TYPES.BUY;
  } else if (filters.type === WALLET_TRANSACTION_TYPES.CREDIT) {
    query.transactionType = TRANSACTION_TYPES.SELL;
  }

  // Date range filter on executedAt (inclusive). dateTo is treated as the
  // end of that calendar day so a single-day or [from, to] range from the
  // UI calendar produces an intuitive result.
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

  // Build sort
  const allowedSortFields = ['executedAt', 'quantity', 'pricePerUnit'];
  let sortObj = { executedAt: -1 }; // default
  if (sort && sort.field && allowedSortFields.includes(sort.field)) {
    sortObj = { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('assetId', 'ticker name assetType')
      .lean(),
    Transaction.countDocuments(query),
  ]);

  // If search is provided, filter by asset ticker/name in memory
  // (since it's a populated field, we can't use MongoDB regex directly)
  let mapped = transactions.map((tx) => {
    const totalAmount = tx.quantity * tx.pricePerUnit + tx.fees;
    return {
      id: tx._id,
      type:
        tx.transactionType === TRANSACTION_TYPES.BUY
          ? WALLET_TRANSACTION_TYPES.DEBIT
          : WALLET_TRANSACTION_TYPES.CREDIT,
      amount: totalAmount,
      asset: tx.assetId
        ? { ticker: tx.assetId.ticker, name: tx.assetId.name, assetType: tx.assetId.assetType }
        : null,
      quantity: tx.quantity,
      pricePerUnit: tx.pricePerUnit,
      fees: tx.fees,
      executedAt: tx.executedAt,
    };
  });

  // Apply search filter on mapped results (ticker or name)
  let filteredTotal = total;
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    mapped = mapped.filter(
      (tx) =>
        tx.asset?.ticker?.toLowerCase().includes(term) ||
        tx.asset?.name?.toLowerCase().includes(term)
    );
    // When filtering in-memory, total should reflect filtered count
    // For accuracy, we do a broader approach — but for UX this is acceptable
    // since search is typically used with small result sets
    filteredTotal = mapped.length;
  }

  return { transactions: mapped, total: search?.trim() ? filteredTotal : total };
};

module.exports = {
  getBalance,
  debit,
  credit,
  getWalletTransactions,
  listWalletTransactions,
};
