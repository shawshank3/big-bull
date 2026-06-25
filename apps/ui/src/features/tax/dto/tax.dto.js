import { str, num, arr } from '@/shared/dto/helpers';

/**
 * Transform a single gain record from raw API response.
 */
export function toGainRecordDTO(raw) {
  return {
    assetId: str(raw?.assetId),
    ticker: str(raw?.ticker),
    name: str(raw?.name),
    assetType: str(raw?.assetType),
    buyDate: str(raw?.buyDate),
    sellDate: str(raw?.sellDate),
    quantity: num(raw?.quantity),
    buyPrice: num(raw?.buyPrice),
    sellPrice: num(raw?.sellPrice),
    gain: num(raw?.gain),
    gainType: str(raw?.gainType),
    holdingDays: num(raw?.holdingDays),
  };
}

/**
 * Transform the gains ledger response (gains array + summary + pagination).
 */
export function toGainsDTO(raw) {
  return {
    gains: arr(raw?.gains).map(toGainRecordDTO),
    summary: {
      totalSTCG: num(raw?.summary?.totalSTCG),
      totalLTCG: num(raw?.summary?.totalLTCG),
      netRealizedGain: num(raw?.summary?.netRealizedGain),
    },
    pagination: {
      page: num(raw?.pagination?.page, 1),
      limit: num(raw?.pagination?.limit, 20),
      total: num(raw?.pagination?.total),
      totalPages: num(raw?.pagination?.totalPages),
    },
  };
}

/**
 * Transform the tax summary response.
 */
export function toSummaryDTO(raw) {
  return {
    totalSTCG: num(raw?.totalSTCG),
    totalLTCG: num(raw?.totalLTCG),
    netRealizedGain: num(raw?.netRealizedGain),
    stcgTax: num(raw?.stcgTax),
    ltcgTax: num(raw?.ltcgTax),
    estimatedTax: num(raw?.estimatedTax),
    harvestingCount: num(raw?.harvestingCount),
    taxYear: num(raw?.taxYear),
  };
}

/**
 * Transform a single harvesting opportunity from raw API response.
 */
export function toOpportunityDTO(raw) {
  return {
    assetId: str(raw?.assetId),
    ticker: str(raw?.ticker),
    name: str(raw?.name),
    assetType: str(raw?.assetType),
    sector: str(raw?.sector),
    unrealizedLoss: num(raw?.unrealizedLoss),
    currentPrice: num(raw?.currentPrice),
    avgCostBasis: num(raw?.avgCostBasis),
    quantity: num(raw?.quantity),
    holdingDays: num(raw?.holdingDays),
    lossType: str(raw?.lossType),
    estimatedSaving: num(raw?.estimatedSaving),
    offsetsGainType: str(raw?.offsetsGainType),
  };
}

/**
 * Transform the harvesting response (opportunities array + meta).
 */
export function toHarvestingDTO(raw) {
  return {
    opportunities: arr(raw?.opportunities).map(toOpportunityDTO),
    meta: {
      minLoss: num(raw?.meta?.minLoss),
      totalOpportunities: num(raw?.meta?.totalOpportunities),
      isCurrentFY: raw?.meta?.isCurrentFY !== false,
    },
  };
}
