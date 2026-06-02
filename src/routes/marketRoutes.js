/**
 * Market Routes
 * Stock and mutual fund search and quote endpoints
 */
const express = require('express');
const { search, getStock, getMutual } = require('../controllers/marketController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/search', search);
router.get('/stocks/:symbol', getStock);
router.get('/mutuals/:schemeCode', getMutual);

module.exports = router;
