/**
 * Redis client singleton (ioredis)
 * Connects to REDIS_URL. If not configured, exports a no-op stub so the app
 * runs without Redis — all cache operations become silent no-ops.
 */
const Redis = require('ioredis');

let redis;

if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not set — running without Redis cache. Cache operations are disabled.');
  // No-op stub: all methods return resolved promises with null
  redis = new Proxy({}, {
    get: () => () => Promise.resolve(null),
  });
} else {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  redis.on('connect', () => console.log('✓ Redis connected'));
  redis.on('error', (err) => console.error('✗ Redis error:', err.message));
}

module.exports = redis;
