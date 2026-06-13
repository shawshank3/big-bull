/**
 * Transaction Controller
 * Handles HTTP layer for order execution and transaction history.
 *
 * Routes:
 *   POST /order  → executeOrder
 *   GET  /       → getHistory
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const transactionService = require('./transaction.service');
const { orderSchema, historyQuerySchema } = require('./transaction.validator');

/**
 * POST /transactions/order
 *
 * Places a BUY or SELL order for the authenticated user.
 * Validates the request body, delegates to transactionService.executeOrder,
 * and returns the created transaction document.
 */
const executeOrder = catchAsync(async (req, res) => {
  const result = orderSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid order payload';
    throw new AppError(message, 400);
  }

  const transaction = await transactionService.executeOrder(req.user.id, result.data);

  sendSuccess(res, { transaction }, 'Order executed successfully', 201);
});

/**
 * GET /transactions
 *
 * Returns a paginated, reverse-chronological transaction history for the
 * authenticated user.
 */
const getHistory = catchAsync(async (req, res) => {
  const result = historyQuerySchema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid query parameters';
    throw new AppError(message, 400);
  }

  const data = await transactionService.getTransactionHistory(req.user.id, result.data);

  sendSuccess(res, data, 'Transaction history retrieved');
});

module.exports = { executeOrder, getHistory };
