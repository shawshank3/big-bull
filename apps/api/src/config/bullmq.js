const { Queue } = require('bullmq');
const redis = require('../shared/redis');

// BullMQ needs a real ioredis instance. If redis is the no-op Proxy (no REDIS_URL),
// skip queue creation and export nulls so workers degrade gracefully.
const isRedisAvailable = redis && typeof redis.options !== 'undefined';

const makeQueue = (name) => {
  if (!isRedisAvailable) {
    console.warn(`⚠️  BullMQ: skipping queue "${name}" — Redis not configured`);
    return null;
  }
  return new Queue(name, { connection: redis });
};

const msePriceTickQueue     = makeQueue('mse-price-tick');
const netWorthSnapshotQueue = makeQueue('net-worth-snapshot');
const goalStatusSyncQueue   = makeQueue('goal-status-sync');

module.exports = { msePriceTickQueue, netWorthSnapshotQueue, goalStatusSyncQueue };
