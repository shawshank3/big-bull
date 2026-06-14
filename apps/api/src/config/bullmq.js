const { Queue } = require('bullmq');
const { makeBullMQConnection, isRedisConfigured } = require('../shared/redisBullMQ');

const makeQueue = (name) => {
  if (!isRedisConfigured) {
    console.warn(`⚠️  BullMQ: skipping queue "${name}" — Redis not configured`);
    return null;
  }
  // Each Queue gets its own connection as recommended by BullMQ docs
  return new Queue(name, { connection: makeBullMQConnection() });
};

const msePriceTickQueue = makeQueue('mse-price-tick');
const netWorthSnapshotQueue = makeQueue('net-worth-snapshot');
const goalStatusSyncQueue = makeQueue('goal-status-sync');

module.exports = { msePriceTickQueue, netWorthSnapshotQueue, goalStatusSyncQueue };
