/**
 * Seed Script
 * Populate database with demo data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Holding = require('../src/models/Holding');

const seedDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bigbull';
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Holding.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create demo user
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@bigbull.com',
      password: 'Demo@123',
    });
    console.log('✓ Created demo user:', user.email);

    // Create sample holdings
    const holdings = await Holding.create([
      {
        user: user._id,
        type: 'mutual',
        name: 'Alpha Growth Fund',
        symbol: 'AGF',
        qty: 12,
        avgPrice: 95.5,
        currentPrice: 102.3,
        notes: 'High-growth equity fund',
      },
      {
        user: user._id,
        type: 'mutual',
        name: 'Beta Dividend Fund',
        symbol: 'BDF',
        qty: 8,
        avgPrice: 120.0,
        currentPrice: 118.4,
        notes: 'Dividend-focused balanced fund',
      },
      {
        user: user._id,
        type: 'stock',
        name: 'Apple Inc.',
        symbol: 'AAPL',
        qty: 5,
        avgPrice: 150.0,
        currentPrice: 172.2,
        notes: 'Tech giant',
      },
      {
        user: user._id,
        type: 'stock',
        name: 'Microsoft Corporation',
        symbol: 'MSFT',
        qty: 3,
        avgPrice: 210.5,
        currentPrice: 215.1,
        notes: 'Cloud computing leader',
      },
      {
        user: user._id,
        type: 'stock',
        name: 'Tesla Inc.',
        symbol: 'TSLA',
        qty: 2,
        avgPrice: 250.0,
        currentPrice: 268.5,
        notes: 'EV manufacturer',
      },
      {
        user: user._id,
        type: 'mutual',
        name: 'Gamma Income Fund',
        symbol: 'GIF',
        qty: 10,
        avgPrice: 110.0,
        currentPrice: 109.5,
        notes: 'Fixed income fund',
      },
    ]);

    console.log(`✓ Created ${holdings.length} sample holdings`);

    // Calculate and display portfolio stats
    let totalInvested = 0;
    let totalCurrent = 0;

    holdings.forEach(h => {
      totalInvested += h.qty * h.avgPrice;
      totalCurrent += h.qty * h.currentPrice;
    });

    console.log('\n📊 Portfolio Statistics:');
    console.log(`   Total Invested: ₹${totalInvested.toFixed(2)}`);
    console.log(`   Current Value: ₹${totalCurrent.toFixed(2)}`);
    console.log(`   Total Return: ₹${(totalCurrent - totalInvested).toFixed(2)}`);
    console.log(`   Return %: ${(((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(2)}%`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Email: demo@bigbull.com');
    console.log('Password: Demo@123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
