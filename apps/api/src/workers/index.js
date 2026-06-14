require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { scheduleMseTick } = require('./mseWorker');
const { startLiveTicker } = require('./mseLiveTicker');

console.log('🔧 BigBull Worker process starting...');

// Start all workers and schedule repeating jobs
(async () => {
  try {
    await scheduleMseTick();
    startLiveTicker();
    console.log('✓ All workers initialised');
  } catch (err) {
    console.error('✗ Worker initialisation failed:', err.message);
    process.exit(1);
  }
})();
