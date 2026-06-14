/**
 * Market Controller
 * Handles search, quote, asset listing, and SSE price-stream endpoints.
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const { searchQuerySchema } = require('./market.validator');
const marketService = require('./market.service');
const Asset = require('../asset/asset.model');

/** Module-level map of active SSE clients: clientId → res */
const sseClients = new Map();

/**
 * GET /market/search?q=...
 */
const search = catchAsync(async (req, res) => {
  const result = searchQuerySchema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? 'Invalid search query';
    throw new AppError(message, 400);
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
 * GET /market/stream  (SSE — auth required)
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
  if (req.query.type === 'STOCK' || req.query.type === 'MUTUAL_FUND') {
    filter.assetType = req.query.type;
  }
  const rawAssets = await Asset.find(filter).sort({ ticker: 1 }).lean();

  // Enrich each asset with the latest Redis price (same pattern as searchAssets)
  const redis = require('../../shared/redis');
  const assets = await Promise.all(
    rawAssets.map(async (asset) => {
      let currentPrice = asset.basePrice;
      try {
        const cached = await redis.get(`price:${asset.ticker}`);
        if (cached !== null) {
          const parsed = JSON.parse(cached);
          currentPrice = parsed.price ?? parsed ?? currentPrice;
        }
      } catch (_) {
        /* use basePrice */
      }
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
  if (!asset) throw new AppError(`Asset not found: ${ticker}`, 404);
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

module.exports = {
  search,
  getQuote,
  getTicker,
  getAssets,
  getAssetByTicker,
  stream,
  broadcastPriceUpdate,
  broadcastVolatilityAlert,
};
