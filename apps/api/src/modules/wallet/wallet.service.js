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
const AppError = require('../../shared/AppError');

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

module.exports = {
  getBalance,
  debit,
  credit,
};
