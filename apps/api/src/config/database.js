/**
 * Database Configuration
 * MongoDB connection setup
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;

    await mongoose.connect(MONGO_URI);

    console.log(`✓ MongoDB connected`);
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
