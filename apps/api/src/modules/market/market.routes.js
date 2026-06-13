const { Router } = require('express');
const {
  search,
  getQuote,
  getTicker,
  getAssets,
  getAssetByTicker,
  stream,
} = require('./market.controller');
const authMiddleware = require('../../middleware/authMiddleware');

const router = Router();

router.get('/ticker', getTicker); // ticker strip — public
router.get('/assets', getAssets); // catalog list — public
router.get('/assets/:ticker', getAssetByTicker); // single asset — public
router.get('/search', search); // catalog search — public
router.get('/quote/:ticker', getQuote); // live price — public
router.get('/stream', authMiddleware, stream); // SSE — auth required

module.exports = router;
