import { str, num, arr } from '@/shared/dto/helpers';

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
    executedAt:
      typeof execAt === 'string' ? execAt : execAt instanceof Date ? execAt.toISOString() : '',
  };
}

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

export function toOrderResultDTO(raw) {
  return {
    transaction: toTransactionDTO(raw?.transaction),
  };
}
