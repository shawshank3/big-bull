const { Worker } = require('bullmq');
const redis = require('../shared/redis');

// Lazy-require to avoid circular dependency issues at startup
const getBroadcast = () => require('../modules/market/market.controller').broadcastPriceUpdate;

const isRedisAvailable = redis && typeof redis.options !== 'undefined';

let mseWorker = null;

if (isRedisAvailable) {
  mseWorker = new Worker(
    'mse-price-tick',
    async (job) => {
      console.log(`[MSE] Price tick job #${job.id} — processing`);

      // Phase 1 skeleton: broadcast a mock price update
      // Phase 2+ will replace this with real Asset price simulation
      const mockPayload = {
        ticker: 'MOCK',
        price: parseFloat((Math.random() * 100 + 100).toFixed(2)),
        change: 0,
        changePercent: '0.00%',
        timestamp: new Date().toISOString(),
      };

      try {
        getBroadcast()(mockPayload);
      } catch (err) {
        // SSE clients map may be empty — not an error
      }

      console.log(`[MSE] Tick broadcast: ₹${mockPayload.price}`);
    },
    { connection: redis }
  );

  mseWorker.on('completed', (job) => console.log(`[MSE] Job ${job.id} completed`));
  mseWorker.on('failed', (job, err) => console.error(`[MSE] Job ${job?.id} failed:`, err.message));

  console.log('✓ MSE price-tick worker started');
} else {
  console.warn('⚠️  MSE worker: Redis not configured — worker disabled');
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

const { msePriceTickQueue } = require('../config/bullmq');

const scheduleMseTick = async () => {
  if (!msePriceTickQueue) return;
  // Remove existing repeatable jobs to avoid duplicates on restart
  const existing = await msePriceTickQueue.getRepeatableJobs();
  for (const job of existing) {
    await msePriceTickQueue.removeRepeatableByKey(job.key);
  }
  await msePriceTickQueue.add(
    'tick',
    {},
    { repeat: { every: 30000 } } // every 30 seconds
  );
  console.log('✓ MSE price-tick job scheduled (every 30s)');
};

module.exports = { mseWorker, scheduleMseTick };
