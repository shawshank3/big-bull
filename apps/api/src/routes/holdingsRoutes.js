/**
 * Holdings Routes
 * Routes for holdings CRUD operations
 */
const express = require('express');
const {
  getAllHoldings,
  getMutuals,
  getStocks,
  getHolding,
  createHolding,
  updateHolding,
  deleteHolding,
  getPortfolioSummary,
} = require('../controllers/holdingsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(authMiddleware);

// Portfolio routes
router.get('/summary', getPortfolioSummary);

// Holdings routes
router.get('/', getAllHoldings);
router.get('/mutuals', getMutuals);
router.get('/stocks', getStocks);
router.post('/', createHolding);

// Single holding routes
router.get('/:id', getHolding);
router.put('/:id', updateHolding);
router.delete('/:id', deleteHolding);

module.exports = router;
