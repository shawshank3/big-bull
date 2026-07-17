const { Queue } = require('bullmq');
const { makeBullMQConnection, isRedisConfigured } = require('../shared/redisBullMQ');

/**
 * Default job retention options applied to every queue.
 *
 * Without these, BullMQ keeps completed and failed job records in Redis
 * forever.  The mse-price-tick queue fires every 30s — that's 2,880 completed
 * records per day — which quickly exhausts Redis memory on constrained plans.
 *
 * - removeOnComplete: keep the last 20 completed records (enough for debugging)
 * - removeOnFail:     keep the last 50 failed records (more context for failures)
 */
const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: { count: 20 },
  removeOnFail: { count: 50 },
};

const makeQueue = (name) => {
  if (!isRedisConfigured) {
    console.warn(`⚠️  BullMQ: skipping queue "${name}" — Redis not configured`);
    return null;
  }
  // Each Queue gets its own connection as recommended by BullMQ docs.
  // defaultJobOptions are inherited by every job added to this queue.
  return new Queue(name, {
    connection: makeBullMQConnection(),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
};

const msePriceTickQueue = makeQueue('mse-price-tick');

module.exports = { msePriceTickQueue };
