require('dotenv').config();
const app = require('./src/server');
const { writeTodayClose } = require('./src/workers/dailyPriceService');

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    missing.forEach((key) => console.error(`Missing required environment variable: ${key}`));
    process.exit(1);
  }
}

validateEnv();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 BigBull API Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
  console.log(`🤖 Gemini API key configured: ${!!process.env.GEMENI_API_KEY}`);
  console.log('\n');
});

/**
 * Graceful shutdown helper.
 * 1. Stop accepting new HTTP connections.
 * 2. Snapshot today's closing prices into DailyPrice before the process exits.
 *    This ensures every day the server ran has at least one DailyPrice record
 *    regardless of whether the server reaches end-of-day.
 */
const gracefulShutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    console.log('HTTP server closed');
    await writeTodayClose();
    console.log('Goodbye 👋');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
