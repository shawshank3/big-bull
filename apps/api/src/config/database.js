/**
 * Database Configuration
 * MongoDB connection setup
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both MONGODB_URI (new standard) and MONGO_URI (legacy alias)
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bigbull';
    
    await mongoose.connect(MONGO_URI);

    console.log(`✓ MongoDB connected`);
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
