import { str, num } from './helpers';

// ---------------------------------------------------------------------------
// toWalletDTO
// Consumed by: getWallet
// Raw source: wallet.controller.js → sendSuccess(res, { balance, currency: 'INR' })
// ---------------------------------------------------------------------------

export function toWalletDTO(raw) {
  return {
    balance: num(raw?.balance),
    currency: str(raw?.currency, 'INR'),
  };
}
