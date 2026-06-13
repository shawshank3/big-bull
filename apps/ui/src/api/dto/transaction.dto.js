import { str, num, arr } from './helpers';

// ---------------------------------------------------------------------------
// toTransactionDTO
// Consumed by: toTransactionHistoryDTO, toOrderResultDTO
// Raw source: transaction.model.js lean document
// ---------------------------------------------------------------------------

export function toTransactionDTO(raw) {
  const execAt = raw?.executedAt;
  return {
    id: str(raw?._id ?? raw?.id),
    assetId: str(raw?.assetId),
    transactionType: str(raw?.transactionType),
    quantity: num(raw?.quantity),
    pricePerUnit: num(raw?.pricePerUnit),
    fees: num(raw?.fees),
    notes: str(raw?.notes),
    // executedAt may be a Date (before JSON round-trip) or ISO string (after)
    executedAt:
      typeof execAt === 'string' ? execAt : execAt instanceof Date ? execAt.toISOString() : '',
  };
}

// ---------------------------------------------------------------------------
// toTransactionHistoryDTO
// Consumed by: getTransactions
// Raw source: transaction.service.js → getTransactionHistory → { transactions, pagination }
// ---------------------------------------------------------------------------

export function toTransactionHistoryDTO(raw) {
  return {
    transactions: arr(raw?.transactions).map(toTransactionDTO),
    pagination: {
      total: num(raw?.pagination?.total),
      page: num(raw?.pagination?.page, 1),
      limit: num(raw?.pagination?.limit, 20),
      totalPages: num(raw?.pagination?.totalPages),
    },
  };
}

// ---------------------------------------------------------------------------
// toOrderResultDTO
// Consumed by: executeOrder
// Raw source: transaction.controller.js → sendSuccess(res, { transaction })
// ---------------------------------------------------------------------------

export function toOrderResultDTO(raw) {
  return {
    transaction: toTransactionDTO(raw?.transaction),
  };
}
