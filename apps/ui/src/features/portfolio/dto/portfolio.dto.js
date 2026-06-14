import { str, num, arr } from '@/shared/dto/helpers';

export function toHoldingDTO(raw) {
  const assetType = str(raw?.asset?.assetType);
  const type = assetType === 'MUTUAL_FUND' ? 'mutual' : 'stock';

  return {
    assetId: str(raw?.assetId),
    ticker: str(raw?.asset?.ticker),
    name: str(raw?.asset?.name),
    assetType,
    type,
    exchange: raw?.asset?.exchange == null ? null : str(raw.asset.exchange),
    sector: raw?.asset?.sector == null ? null : str(raw.asset.sector),
    netQuantity: num(raw?.netQuantity),
    qty: num(raw?.netQuantity),
    avgCostBasis: num(raw?.avgCostBasis),
    avgPrice: num(raw?.avgCostBasis),
    currentPrice: num(raw?.currentPrice),
    currentValue: num(raw?.currentValue),
    totalInvested: num(raw?.totalInvested),
    unrealisedPnL: num(raw?.unrealisedPnL),
    unrealisedPnLPercent: num(raw?.unrealisedPnLPercent),
    portfolioWeight: num(raw?.portfolioWeight),
    asset: {
      ticker: str(raw?.asset?.ticker),
      name: str(raw?.asset?.name),
      assetType,
      exchange: raw?.asset?.exchange == null ? null : str(raw.asset.exchange),
      sector: raw?.asset?.sector == null ? null : str(raw.asset.sector),
    },
  };
}

export function toHoldingListDTO(raw) {
  return arr(raw).map(toHoldingDTO);
}

export function toSummaryDTO(raw) {
  return {
    totalInvested: num(raw?.totalInvested),
    currentValue: num(raw?.currentValue),
    totalPnL: num(raw?.totalPnL),
    totalPnLPercent: num(raw?.totalPnLPercent),
    holdingCount: num(raw?.holdingCount),
    cashBalance: num(raw?.cashBalance),
    currency: str(raw?.currency, 'INR'),
  };
}
