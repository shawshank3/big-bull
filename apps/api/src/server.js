/**
 * Server Configuration
 * Main Express server setup
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
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
app.use(cors());

app.use(setNoCacheHeaders);
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

// Connect to database
connectDB();

// Serve built frontend UI
app.use(express.static(uiDistPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BigBull API is running',
    version: '1.0.0',
  });
});

// API Routes
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
