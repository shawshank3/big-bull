/**
 * Wallet Controller
 * HTTP handlers for the VirtualWallet module.
 */
const catchAsync = require('../../shared/catchAsync');
const walletService = require('./wallet.service');
const { sendSuccess } = require('../../utils/response');

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

module.exports = {
  getWallet,
};
