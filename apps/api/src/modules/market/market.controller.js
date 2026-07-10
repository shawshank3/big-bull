/**
 * Market Controller
 * Handles search, quote, asset listing, and SSE price-stream endpoints.
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const redis = require('../../shared/redis');
const { sendSuccess } = require('../../utils/response');
const { sendPaginatedSuccess, baseListQuerySchema } = require('../../shared/pagination');
const { searchQuerySchema } = require('./market.validator');
const marketService = require('./market.service');
const Asset = require('../asset/asset.model');
const { z } = require('zod');
const { ASSET_TYPE_VALUES, ASSET_TYPES, HTTP_STATUS } = require('../../shared/constants');

/** Module-level map of active SSE clients: clientId → res */
const sseClients = new Map();

/**
 * Zod schema for POST /market/assets/list body.
 */
const assetListSchema = baseListQuerySchema.extend({
  filters: z
    .object({
      assetType: z.enum(ASSET_TYPE_VALUES).optional(),
      sector: z.string().optional(),
    })
    .optional()
    .default({}),
});

/**
 * GET /market/search?q=...
 */
const search = catchAsync(async (req, res) => {
  const result = searchQuerySchema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid search query';
    throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  const results = await marketService.searchAssets(result.data.q);
  sendSuccess(res, { results }, 'Search completed');
});

/**
 * GET /market/quote/:ticker
 */
const getQuote = catchAsync(async (req, res) => {
  const ticker = req.params.ticker.trim().toUpperCase();
  const quote = await marketService.getQuote(ticker);
  sendSuccess(res, quote, 'Quote retrieved');
});

/**
 * GET /market/stream  (SSE — public)
 * Not wrapped in catchAsync; SSE setup is synchronous.
 */
const stream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = req.user?.id ?? 'anon-' + Date.now();
  sseClients.set(clientId, res);

  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
};

/**
 * GET /market/assets?type=STOCK|MUTUAL_FUND
 * Returns all seeded assets from the catalog enriched with live Redis prices.
 */
const getAssets = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.type && ASSET_TYPE_VALUES.includes(req.query.type)) {
    filter.assetType = req.query.type;
  }
  const rawAssets = await Asset.find(filter).sort({ ticker: 1 }).lean();

  // Enrich each asset with the latest price via the three-tier resolution chain
  const { resolvePrice } = require('./market.service');
  const assets = await Promise.all(
    rawAssets.map(async (asset) => {
      const currentPrice = await resolvePrice(asset.ticker, asset.basePrice).catch(
        () => asset.basePrice
      );
      return { ...asset, currentPrice };
    })
  );

  sendSuccess(res, { assets }, 'Assets retrieved');
});

/**
 * GET /market/assets/:ticker
 * Returns a single asset by NSE ticker / MF scheme code.
 */
const getAssetByTicker = catchAsync(async (req, res) => {
  const ticker = req.params.ticker.trim().toUpperCase();
  const asset = await Asset.findOne({ ticker }).lean();
  if (!asset) throw new AppError(`Asset not found: ${ticker}`, HTTP_STATUS.NOT_FOUND);
  sendSuccess(res, { asset }, 'Asset retrieved');
});

/**
 * GET /market/ticker
 * Returns live simulated prices for top NSE stocks (used by the ticker strip).
 */
const getTicker = catchAsync(async (req, res) => {
  const data = await marketService.getTicker();
  sendSuccess(res, data, 'Ticker quotes retrieved');
});

/**
 * Broadcast a price update payload to all connected SSE clients.
 * @param {object} payload
 */
const broadcastPriceUpdate = (payload) => {
  const data = 'event: price_update\ndata: ' + JSON.stringify(payload) + '\n\n';
  for (const res of sseClients.values()) {
    res.write(data);
  }
};

/**
 * Broadcast a volatility alert to all connected SSE clients.
 * @param {object} payload
 */
const broadcastVolatilityAlert = (payload) => {
  const data = 'event: volatility_alert\ndata: ' + JSON.stringify(payload) + '\n\n';
  for (const res of sseClients.values()) {
    res.write(data);
  }
};

/**
 * POST /market/assets/list
 * Standardised paginated asset listing with filters and search.
 */
const listAssets = catchAsync(async (req, res) => {
  const result = assetListSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid request payload';
    throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  const { pagination, filters, search, sort } = result.data;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build filter query
  const query = {};
  if (filters.assetType) {
    query.assetType = filters.assetType;
  }
  if (filters.sector) {
    query.sector = filters.sector;
  }

  // Text search on ticker or name
  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { ticker: { $regex: term, $options: 'i' } },
      { name: { $regex: term, $options: 'i' } },
      { sector: { $regex: term, $options: 'i' } },
    ];
  }

  // Build sort
  const allowedSortFields = ['ticker', 'name', 'sector', 'basePrice'];
  let sortObj = { ticker: 1 }; // default
  if (sort && sort.field && allowedSortFields.includes(sort.field)) {
    sortObj = { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }

  const [rawAssets, total] = await Promise.all([
    Asset.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
    Asset.countDocuments(query),
  ]);

  // Enrich with live prices and day change data
  const { resolveAssetPrice } = require('./market.service');
  const assets = await Promise.all(
    rawAssets.map(async (asset) => {
      const currentPrice = await resolveAssetPrice(asset).catch(() => asset.basePrice);

      let change = 0;
      let changePercent = '+0.00%';

      // Read change metadata from Redis (set by mseWorker on each tick)
      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (typeof parsed.change === 'number') change = parsed.change;
          if (typeof parsed.changePercent === 'string') changePercent = parsed.changePercent;
        }
      } catch (_) {
        /* non-fatal */
      }

      return { ...asset, currentPrice, change, changePercent };
    })
  );

  sendPaginatedSuccess(res, assets, total, page, limit, 'Assets retrieved');
});

/**
 * GET /market/movers?limit=4
 * Returns top N gainers and top N losers sorted by 1D changePercent.
 * Only STOCK assets are included (mutual funds don't have intraday Redis ticks).
 */
const getMovers = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit ?? '4', 10) || 4, 20);

  // Fetch all stock assets and enrich with live prices + change data from Redis
  const rawAssets = await Asset.find({ assetType: ASSET_TYPES.STOCK }).lean();

  const { resolveAssetPrice } = require('./market.service');
  const enriched = await Promise.all(
    rawAssets.map(async (asset) => {
      const currentPrice = await resolveAssetPrice(asset).catch(() => asset.basePrice);

      let change = 0;
      let changePercent = '+0.00%';
      let changePercentValue = 0;

      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (typeof parsed.change === 'number') change = parsed.change;
          if (typeof parsed.changePercent === 'string') {
            changePercent = parsed.changePercent;
            changePercentValue = parseFloat(parsed.changePercent) || 0;
          }
        }
      } catch (_) {
        /* non-fatal */
      }

      return {
        id: asset._id,
        ticker: asset.ticker,
        name: asset.name,
        assetType: asset.assetType,
        sector: asset.sector,
        exchange: asset.exchange ?? null,
        currentPrice,
        change,
        changePercent,
        changePercentValue,
        currency: 'INR',
      };
    })
  );

  // Sort descending by numeric changePercent
  const sorted = enriched.sort((a, b) => b.changePercentValue - a.changePercentValue);

  const gainers = sorted.slice(0, limit);
  const losers = sorted.slice(-limit).reverse();

  sendSuccess(res, { gainers, losers }, 'Top movers retrieved');
});

module.exports = {
  search,
  getQuote,
  getTicker,
  getAssets,
  getAssetByTicker,
  listAssets,
  getMovers,
  stream,
  broadcastPriceUpdate,
  broadcastVolatilityAlert,
};
