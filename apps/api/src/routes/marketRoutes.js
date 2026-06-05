/**
 * Market Routes
 * Stock and mutual fund search and quote endpoints
 * These are public — no auth required.
 */
const express = require('express');
const { search, getStock, getMutual, getTicker } = require('../controllers/marketController');

const router = express.Router();

router.get('/search', search);
router.get('/ticker', getTicker);
router.get('/stocks/:symbol', getStock);
router.get('/mutuals/:schemeCode', getMutual);

module.exports = router;
