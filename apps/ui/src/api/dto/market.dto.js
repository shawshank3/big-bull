import { str, num, bool, arr } from './helpers';

// ---------------------------------------------------------------------------
// toAssetDTO
// Consumed by: getAssetByTicker; also used inside toAssetListDTO, toSearchResultDTO
// Raw source: asset.model.js lean document { _id, ticker, name, assetType, ... }
// ---------------------------------------------------------------------------

export function toAssetDTO(raw) {
  return {
    id: str(raw?._id ?? raw?.id),
    ticker: str(raw?.ticker),
    name: str(raw?.name),
    assetType: str(raw?.assetType),
    exchange: raw?.exchange == null ? null : str(raw.exchange),
    sector: raw?.sector == null ? null : str(raw.sector),
    basePrice: num(raw?.basePrice),
    currentPrice: num(raw?.currentPrice ?? raw?.basePrice),
    currency: str(raw?.currency, 'INR'),
  };
}

// ---------------------------------------------------------------------------
// toAssetListDTO
// Consumed by: getAssets
// ---------------------------------------------------------------------------

export function toAssetListDTO(raw) {
  return arr(raw).map(toAssetDTO);
}

// ---------------------------------------------------------------------------
// toSearchResultDTO
// Consumed by: searchMarket
// Raw source: market.service.js → searchAssets → { query, stocks, mutuals, results }
// ---------------------------------------------------------------------------

export function toSearchResultDTO(raw) {
  const src = raw ?? {};
  return {
    query: str(src.query),
    stocks: arr(src.stocks).map(toAssetDTO),
    mutuals: arr(src.mutuals).map(toAssetDTO),
    results: arr(src.results).map(toAssetDTO),
  };
}

// ---------------------------------------------------------------------------
// toQuoteDTO
// Consumed by: getStockQuote, getMutualQuote
// Raw source: market.service.js → getQuote — flat object with stock + mutual fields
// ---------------------------------------------------------------------------

export function toQuoteDTO(raw) {
  return {
    ticker: str(raw?.ticker ?? raw?.symbol),
    name: str(raw?.name),
    assetType: str(raw?.assetType ?? raw?.type),
    price: num(raw?.price),
    priceLabel: str(raw?.priceLabel, 'Price'),
    currency: str(raw?.currency, 'INR'),
    change: num(raw?.change),
    changePercent: str(raw?.changePercent, '0.00%'),
    sector: raw?.sector == null ? null : str(raw.sector),
  };
}

// ---------------------------------------------------------------------------
// toTickerDTO
// Consumed by: getTickerQuotes
// Raw source: market.service.js → getTicker — returns quotes array directly as data
// ---------------------------------------------------------------------------

export function toTickerDTO(raw) {
  return arr(raw).map((item) => ({
    symbol: str(item?.symbol),
    name: str(item?.name),
    price: num(item?.price),
    currency: str(item?.currency, 'INR'),
    change: num(item?.change),
    changePercent: str(item?.changePercent, '0.00%'),
    up: bool(item?.up),
  }));
}
