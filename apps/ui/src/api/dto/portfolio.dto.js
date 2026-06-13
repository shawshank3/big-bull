import { str, num, arr } from './helpers';

// ---------------------------------------------------------------------------
// toHoldingDTO
// Consumed by: toHoldingListDTO
// Raw source: portfolio.service.js → computeHoldings enriched holding object
// ---------------------------------------------------------------------------

export function toHoldingDTO(raw) {
  const assetType = str(raw?.asset?.assetType);
  // Normalise assetType to the lowercase 'stock' | 'mutual' keys used by
  // HoldingsBreakdown tabs, getAllocation, and HoldingsTable badge logic.
  const type = assetType === 'MUTUAL_FUND' ? 'mutual' : 'stock';

  return {
    assetId: str(raw?.assetId),
    ticker: str(raw?.asset?.ticker),
    name: str(raw?.asset?.name),
    assetType,
    type, // 'stock' | 'mutual' — used by HoldingsBreakdown / getAllocation
    exchange: raw?.asset?.exchange == null ? null : str(raw.asset.exchange),
    sector: raw?.asset?.sector == null ? null : str(raw.asset.sector),
    netQuantity: num(raw?.netQuantity),
    qty: num(raw?.netQuantity), // alias for HoldingsTable / portfolio utils
    avgCostBasis: num(raw?.avgCostBasis),
    avgPrice: num(raw?.avgCostBasis), // alias for HoldingsTable / portfolio utils
    currentPrice: num(raw?.currentPrice),
    currentValue: num(raw?.currentValue),
    totalInvested: num(raw?.totalInvested),
    unrealisedPnL: num(raw?.unrealisedPnL),
    unrealisedPnLPercent: num(raw?.unrealisedPnLPercent),
    portfolioWeight: num(raw?.portfolioWeight),
    // Preserve nested asset shape for any consumers that read holding.asset.*
    asset: {
      ticker: str(raw?.asset?.ticker),
      name: str(raw?.asset?.name),
      assetType,
      exchange: raw?.asset?.exchange == null ? null : str(raw.asset.exchange),
      sector: raw?.asset?.sector == null ? null : str(raw.asset.sector),
    },
  };
}

// ---------------------------------------------------------------------------
// toHoldingListDTO
// Consumed by: getPortfolioHoldings
// Replaces the existing inline transformation in portfolioApi.js
// ---------------------------------------------------------------------------

export function toHoldingListDTO(raw) {
  return arr(raw).map(toHoldingDTO);
}

// ---------------------------------------------------------------------------
// toSummaryDTO
// Consumed by: getPortfolioSummary
// Raw source: portfolio.service.js → computeSummary
// ---------------------------------------------------------------------------

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
