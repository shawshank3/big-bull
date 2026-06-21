const { Router } = require('express');
const {
  search,
  getQuote,
  getTicker,
  getAssets,
  getAssetByTicker,
  stream,
} = require('./market.controller');
const { getChart } = require('./chart.controller');

const router = Router();

router.get('/ticker', getTicker); // public
router.get('/assets', getAssets); // public
router.get('/assets/:ticker', getAssetByTicker); // public
router.get('/search', search); // public
router.get('/quote/:ticker', getQuote); // public
router.get('/stream', stream); // public — SSE price broadcast
router.get('/chart/:ticker', getChart); // public — historical chart data

module.exports = router;
