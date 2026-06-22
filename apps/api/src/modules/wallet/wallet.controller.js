/**
 * Wallet Controller
 * HTTP handlers for the VirtualWallet module.
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const walletService = require('./wallet.service');
const { sendSuccess } = require('../../utils/response');
const { sendPaginatedSuccess, baseListQuerySchema } = require('../../shared/pagination');
const { z } = require('zod');

/**
 * Zod schema for POST /wallet/transactions/list body.
 */
const walletTransactionListSchema = baseListQuerySchema.extend({
  filters: z
    .object({
      type: z.enum(['DEBIT', 'CREDIT']).optional(),
    })
    .optional()
    .default({}),
});

/**
 * GET /api/v1/wallet
 *
 * Returns the authenticated user's current wallet balance.
 * Protected by authMiddleware (req.user is guaranteed to be set).
 */
const getWallet = catchAsync(async (req, res) => {
  const wallet = await walletService.getBalance(req.user.id);

  sendSuccess(res, { balance: wallet.balance, currency: 'INR' }, 'Wallet retrieved');
});

/**
 * POST /api/v1/wallet/transactions/list
 *
 * Returns a paginated, filtered wallet transaction history (debit/credit view).
 * Uses standardised POST body with pagination, filters, search, and sort.
 */
const listWalletTransactions = catchAsync(async (req, res) => {
  const result = walletTransactionListSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid request payload';
    throw new AppError(message, 400);
  }

  const { pagination, filters, search, sort } = result.data;
  const data = await walletService.listWalletTransactions(req.user.id, {
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
    'Wallet transactions retrieved'
  );
});

/**
 * GET /api/v1/wallet/transactions (LEGACY)
 *
 * Returns a paginated, reverse-chronological list of wallet transactions
 * (debit/credit view) with asset details populated.
 *
 * Query params: page (default 1), limit (default 20)
 */
const getWalletTransactions = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const data = await walletService.getWalletTransactions(req.user.id, { page, limit });

  sendSuccess(res, data, 'Wallet transactions retrieved');
});

module.exports = {
  getWallet,
  getWalletTransactions,
  listWalletTransactions,
};
