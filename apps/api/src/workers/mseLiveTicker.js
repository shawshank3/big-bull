/**
 * MSE Live Ticker
 *
 * Broadcasts SSE price_update events every second to all connected clients.
 *
 * Architecture:
 * - The BullMQ mseWorker runs every 30s. It writes authoritative prices to
 *   Redis and calls notifyLiveTicker() to seed the in-memory price cache here.
 * - This module runs a setInterval at 1s. On each tick it applies a tiny
 *   micro-noise to the cached prices and broadcasts via SSE.
 * - No database reads. No Redis writes. Pure in-process simulation.
 *
 * Why split the two?
 * - BullMQ worker: persistence, Redis sync, price history, sector trends.
 * - Live ticker: UI smoothness — 1s visual updates without DB overhead.
 */

const { ASSET_TYPES, SSE_EVENTS } = require('../shared/constants');

// ─── In-memory price cache ────────────────────────────────────────────────────
// Map<ticker, { price, volatility }>
// Seeded/refreshed by the BullMQ worker on every 30s tick.
const priceCache = new Map();

/**
 * Called by mseWorker after each BullMQ tick to refresh the local cache with
 * the authoritative post-tick prices and per-asset volatility.
 *
 * @param {Array<{ ticker: string, price: number, volatility: number, assetType: string }>} assets
 */
const seedPriceCache = (assets) => {
  for (const { ticker, price, volatility, assetType } of assets) {
    priceCache.set(ticker, {
      price,
      volatility: volatility ?? 0.01,
      assetType: assetType ?? ASSET_TYPES.STOCK,
    });
  }
};

// ─── Gaussian noise ───────────────────────────────────────────────────────────
const gaussianNoise = () => {
  const u1 = 1 - Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

// ─── Ticker loop ─────────────────────────────────────────────────────────────
let tickerInterval = null;

const startLiveTicker = () => {
  if (tickerInterval) return; // guard against double-start

  tickerInterval = setInterval(() => {
    if (priceCache.size === 0) return; // nothing to broadcast yet

    // Lazy-require to avoid circular dependency at module load time
    const { broadcastPriceUpdate } = require('../modules/market/market.controller');

    const timestamp = new Date().toISOString();

    for (const [ticker, entry] of priceCache.entries()) {
      // Mutual fund NAVs update once daily — skip intra-day 1s ticks
      if (entry.assetType === ASSET_TYPES.MUTUAL_FUND) continue;

      const prevPrice = entry.price;

      // Micro-noise: much smaller than the 30s tick — scaled to 1/30th of
      // the 30s window so the cumulative drift stays realistic.
      const microVolatility = (entry.volatility ?? 0.01) * 0.18; // ≈ 1/√30 scaling
      const noise = gaussianNoise();
      const newPrice = Math.max(
        1,
        parseFloat((prevPrice * (1 + microVolatility * noise)).toFixed(2))
      );

      const change = parseFloat((newPrice - prevPrice).toFixed(2));
      const pct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const sign = pct >= 0 ? '+' : '';
      const changePercent = `${sign}${pct.toFixed(2)}%`;
      const up = change >= 0;

      // Update in-memory cache
      entry.price = newPrice;

      broadcastPriceUpdate({ ticker, price: newPrice, change, changePercent, up, timestamp });
    }
  }, 1000); // every 1 second

  console.log('✓ MSE live ticker started (1s SSE broadcast)');
};

const stopLiveTicker = () => {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
};

module.exports = { startLiveTicker, stopLiveTicker, seedPriceCache };
