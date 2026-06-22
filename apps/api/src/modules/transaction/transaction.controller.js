/**
 * Transaction Controller
 * Handles HTTP layer for order execution and transaction history.
 *
 * Routes:
 *   POST /order  → executeOrder
 *   POST /list   → listTransactions  (paginated, filtered — standardised)
 *   GET  /       → getHistory         (legacy GET — still supported)
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const { sendPaginatedSuccess } = require('../../shared/pagination');
const transactionService = require('./transaction.service');
const {
  orderSchema,
  historyQuerySchema,
  transactionListSchema,
} = require('./transaction.validator');

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
 * POST /transactions/list
 *
 * Returns a paginated, filtered, searchable transaction history.
 * Uses standardised POST body with pagination, filters, search, and sort.
 */
const listTransactions = catchAsync(async (req, res) => {
  const result = transactionListSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid request payload';
    throw new AppError(message, 400);
  }

  const { pagination, filters, search, sort } = result.data;
  const data = await transactionService.listTransactions(req.user.id, {
    page: pagination.page,
    limit: pagination.limit,
    filters,
    search,
    sort,
  });

  sendPaginatedSuccess(
    res,
    data.transactions,
    data.total,
    pagination.page,
    pagination.limit,
    'Transaction history retrieved'
  );
});

/**
 * GET /transactions (LEGACY)
 *
 * Returns a paginated, reverse-chronological transaction history for the
 * authenticated user. Kept for backward compatibility.
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

module.exports = { executeOrder, getHistory, listTransactions };
