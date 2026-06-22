import { str, num, arr } from '@/shared/dto/helpers';

export function toWalletTransactionDTO(raw) {
  return {
    id: str(raw?.id ?? raw?._id),
    type: str(raw?.type), // DEBIT or CREDIT
    amount: num(raw?.amount),
    asset: raw?.asset
      ? {
          ticker: str(raw.asset.ticker),
          name: str(raw.asset.name),
          assetType: str(raw.asset.assetType),
        }
      : null,
    quantity: num(raw?.quantity),
    pricePerUnit: num(raw?.pricePerUnit),
    fees: num(raw?.fees),
    executedAt:
      typeof raw?.executedAt === 'string'
        ? raw.executedAt
        : raw?.executedAt instanceof Date
          ? raw.executedAt.toISOString()
          : '',
  };
}

export function toWalletTransactionHistoryDTO(raw) {
  return {
    transactions: arr(raw?.transactions).map(toWalletTransactionDTO),
    pagination: {
      total: num(raw?.pagination?.total),
      page: num(raw?.pagination?.page, 1),
      limit: num(raw?.pagination?.limit, 20),
      totalPages: num(raw?.pagination?.totalPages),
    },
  };
}
