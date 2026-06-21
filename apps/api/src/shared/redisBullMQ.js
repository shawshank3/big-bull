/**
 * Redis connection factory for BullMQ.
 *
 * BullMQ requires `maxRetriesPerRequest: null` on the ioredis instance it uses
 * for its blocking queue commands. This is intentionally different from the
 * shared cache client (redis.js) which uses maxRetriesPerRequest: 3.
 *
 * Usage: pass the result of `makeBullMQConnection()` as the `connection` option
 * for every BullMQ Queue and Worker. Each Queue/Worker should get its own
 * connection instance — BullMQ manages the lifecycle internally.
 */
const Redis = require('ioredis');

const isRedisConfigured = !!process.env.REDIS_URL;

/**
 * Returns a new ioredis instance suitable for BullMQ, or null when Redis is
 * not configured (allows the app to start gracefully without Redis).
 */
const makeBullMQConnection = () => {
  if (!isRedisConfigured) return null;

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false, // recommended for BullMQ workers
  });
};

module.exports = { makeBullMQConnection, isRedisConfigured };
