import { str, num, bool, arr } from '@/shared/dto/helpers';

export function toChartDTO(raw) {
  const baseline =
    raw?.baseline && typeof raw.baseline === 'object'
      ? { price: num(raw.baseline.price), date: str(raw.baseline.date) }
      : null;
  return {
    ticker: str(raw?.ticker),
    assetType: str(raw?.assetType),
    range: str(raw?.range, '1D'),
    granularity: str(raw?.granularity, '30s'),
    points: arr(raw?.points).map((p) => ({
      timestamp: str(p?.timestamp),
      price: num(p?.price),
      change: num(p?.change),
      changePercent: str(p?.changePercent),
    })),
    baseline,
  };
}

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

export function toAssetListDTO(raw) {
  return arr(raw).map(toAssetDTO);
}

export function toSearchResultDTO(raw) {
  const src = raw ?? {};
  return {
    query: str(src.query),
    stocks: arr(src.stocks).map(toSearchItemDTO.bind(null, 'stock')),
    mutuals: arr(src.mutuals).map(toSearchItemDTO.bind(null, 'mutual')),
    results: arr(src.results).map((item) => {
      const assetType = str(item?.assetType);
      const type = assetType === 'MUTUAL_FUND' ? 'mutual' : 'stock';
      return toSearchItemDTO(type, item);
    }),
  };
}

// Maps a raw asset into the shape NavbarSearch consumes:
//   type, id, name, symbol (stocks), schemeCode (mutuals), region
function toSearchItemDTO(type, raw) {
  const ticker = str(raw?.ticker);
  return {
    id: str(raw?._id ?? raw?.id),
    type,
    name: str(raw?.name),
    // stocks use ticker as the NSE symbol
    symbol: type === 'stock' ? ticker : '',
    // mutuals use ticker as the scheme code
    schemeCode: type === 'mutual' ? ticker : '',
    region: raw?.exchange == null ? null : str(raw.exchange),
    assetType: str(raw?.assetType),
  };
}

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

export function toTickerDTO(raw) {
  return arr(raw).map((item) => ({
    symbol: str(item?.symbol),
    label: str(item?.label ?? item?.symbol),
    name: str(item?.name),
    price: num(item?.price),
    currency: str(item?.currency, 'INR'),
    change: num(item?.change),
    changePercent: str(item?.changePercent, '+0.00%'),
    up: bool(item?.up, true),
  }));
}
