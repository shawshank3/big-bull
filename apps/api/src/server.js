/**
 * Server Configuration
 * Main Express server setup
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./modules/auth/auth.routes');
const v1WalletRoutes = require('./modules/wallet/wallet.routes');
const v1TransactionRoutes = require('./modules/transaction/transaction.routes');
const v1PortfolioRoutes = require('./modules/portfolio/portfolio.routes');
const v1MarketRoutes = require('./modules/market/market.routes');
const holdingsRoutes = require('./routes/holdingsRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const chatRoutes = require('./routes/chatRoutes');
const marketRoutes = require('./routes/marketRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const uiDistPath = path.join(__dirname, '../../ui/dist');

const setNoCacheHeaders = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();

};

// Middleware
app.disable('etag');
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(cookieParser());

app.use(setNoCacheHeaders);
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

// Connect to database
connectDB();

// Serve built frontend UI
app.use(express.static(uiDistPath));

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
  if (dbState !== 1) {
    return res.status(503).json({
      success: false,
      data: null,
      error: { code: 503, message: 'Database not connected' },
      timestamp: new Date().toISOString(),
    });
  }
  res.json({
    success: true,
    data: { version: '1.0.0', db: 'connected' },
    error: null,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// v1 API — rate limited
app.use('/api/v1', generalLimiter);
app.use('/api/v1/auth', authLimiter, v1AuthRoutes);    // auth gets both limiters
app.use('/api/v1/wallet', v1WalletRoutes);
app.use('/api/v1/transactions', v1TransactionRoutes);
app.use('/api/v1/portfolio', v1PortfolioRoutes);
app.use('/api/v1/market', v1MarketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/holdings', holdingsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/market', marketRoutes);

// SPA fallback for frontend routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(uiDistPath, 'index.html'));
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware
app.use(errorHandler);

module.exports = app;
