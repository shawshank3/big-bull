const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bigbull'

const mongoose = require('mongoose')

mongoose.set('strictQuery', true)
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

const holdingSchema = new mongoose.Schema({
  type: { type: String, enum: ['mutual', 'stock'], required: true },
  name: String,
  symbol: String,
  qty: Number,
  avgPrice: Number,
  currentPrice: Number,
}, { timestamps: true })

const Holding = mongoose.model('Holding', holdingSchema)

// Seed sample data if none
async function seedIfEmpty() {
  const count = await Holding.countDocuments()
  if (count === 0) {
    await Holding.create([
      { type: 'mutual', name: 'Alpha Growth Fund', qty: 12, avgPrice: 95.5, currentPrice: 102.3 },
      { type: 'mutual', name: 'Beta Dividend Fund', qty: 8, avgPrice: 120.0, currentPrice: 118.4 },
      { type: 'stock', symbol: 'AAPL', qty: 5, avgPrice: 150.0, currentPrice: 172.2 },
      { type: 'stock', symbol: 'MSFT', qty: 3, avgPrice: 210.5, currentPrice: 215.1 }
    ])
    console.log('Seeded holdings collection')
  }
}
seedIfEmpty().catch(console.error)

app.get('/holdings/mutuals', async (req, res) => {
  const items = await Holding.find({ type: 'mutual' }).sort({ createdAt: -1 })
  res.json(items)
})

app.get('/holdings/stocks', async (req, res) => {
  const items = await Holding.find({ type: 'stock' }).sort({ createdAt: -1 })
  res.json(items)
})

app.get('/', (req, res) => res.send('big-bull-api is running'))

app.listen(PORT, () => console.log(`big-bull-api listening on http://localhost:${PORT}`))
