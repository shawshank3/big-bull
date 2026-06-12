# Design — Phase 1: Core Architecture Refactor

## Directory Structure After Phase 1

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.validator.js      # Zod schemas: registerSchema, loginSchema
│   │   ├── auth.model.js          # Re-exports User model (no duplication)
│   │   ├── auth.service.js        # issueTokens, validateCredentials, revokeToken
│   │   ├── auth.controller.js     # register, login, logout, me, refresh
│   │   └── auth.routes.js         # /api/v1/auth/*
│   ├── asset/
│   │   ├── asset.model.js         # Asset Mongoose schema
│   │   └── asset.validator.js     # Zod schemas for asset queries
│   ├── transaction/
│   │   ├── transaction.model.js   # Transaction Mongoose schema
│   │   ├── transaction.validator.js # orderSchema (BUY/SELL)
│   │   ├── transaction.service.js # executeOrder, getHistory, aggregateHoldings
│   │   ├── transaction.controller.js
│   │   └── transaction.routes.js  # /api/v1/transactions/*
│   ├── portfolio/
│   │   ├── portfolio.service.js   # computeHoldings, computeSummary
│   │   ├── portfolio.controller.js
│   │   └── portfolio.routes.js    # /api/v1/portfolio/*
│   ├── market/
│   │   ├── market.validator.js    # searchQuerySchema
│   │   ├── market.service.js      # search, getQuote (with Redis cache-aside)
│   │   ├── market.controller.js   # search, quote, stream (SSE)
│   │   └── market.routes.js       # /api/v1/market/*
│   └── wallet/
│       ├── wallet.model.js        # VirtualWallet schema
│       ├── wallet.service.js      # getBalance, debit, credit
│       ├── wallet.controller.js
│       └── wallet.routes.js       # /api/v1/wallet
├── shared/
│   ├── catchAsync.js
│   ├── AppError.js
│   ├── response.js                # sendSuccess, sendError with unified format
│   └── redis.js                   # ioredis singleton
├── middleware/
│   ├── authMiddleware.js          # Cookie-based JWT verification
│   ├── errorHandler.js            # Updated global error handler
│   └── rateLimiter.js             # express-rate-limit configs
├── config/
│   ├── database.js                # Mongoose connection (keep existing)
│   ├── bullmq.js                  # Queue definitions
│   └── market.js                  # Keep existing
├── workers/
│   ├── index.js                   # Worker bootstrap entry point
│   └── mseWorker.js               # MSE price tick skeleton
└── server.js                      # Updated to mount /api/v1/* routes
```

---

## Key Design Decisions

### Cookie Auth Flow
```
POST /api/v1/auth/login
  → validate body with Zod
  → verify credentials in auth.service
  → sign access token (15min) + refresh token (7d)
  → res.cookie('access_token', accessToken, { httpOnly, secure, sameSite:'strict', maxAge: 900000 })
  → res.cookie('refresh_token', refreshToken, { httpOnly, secure, sameSite:'strict', maxAge: 604800000 })
  → return { success: true, data: { user: { id, name, email, role } }, ... }

authMiddleware
  → reads req.cookies.access_token
  → verifies with JWT_SECRET
  → attaches req.user = { id, email, name, role }
```

### Transaction → Portfolio Aggregation Pipeline
The core MongoDB aggregation for computing holdings from transactions:

```js
// In portfolio.service.js
db.transactions.aggregate([
  { $match: { userId: ObjectId(userId) } },
  { $group: {
      _id: '$assetId',
      totalBuyQty:   { $sum: { $cond: [{ $eq: ['$transactionType','BUY']  }, '$quantity', 0] } },
      totalSellQty:  { $sum: { $cond: [{ $eq: ['$transactionType','SELL'] }, '$quantity', 0] } },
      totalBuyCost:  { $sum: { $cond: [{ $eq: ['$transactionType','BUY']  }, { $multiply: ['$quantity','$pricePerUnit'] }, 0] } },
  }},
  { $addFields: {
      netQuantity: { $subtract: ['$totalBuyQty', '$totalSellQty'] },
      avgCostBasis: { $cond: [
        { $gt: ['$totalBuyQty', 0] },
        { $divide: ['$totalBuyCost', '$totalBuyQty'] },
        0
      ]}
  }},
  { $match: { netQuantity: { $gt: 0 } } },   // only active holdings
  { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
  { $unwind: '$asset' }
])
```

After aggregation, current prices are fetched from Redis (or Asset.basePrice as fallback) and merged in-memory.

### Wallet Atomic Update
Wallet balance changes must be atomic with transaction writes. Use a Mongoose session:

```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Transaction.create([txData], { session });
  await VirtualWallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: delta } },  // delta = negative for BUY, positive for SELL
    { session, new: true }
  );
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

### SSE Broadcast Architecture
A simple in-memory client registry:

```js
// market.controller.js
const sseClients = new Map(); // userId → res

const stream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = req.user?.id ?? `anon-${Date.now()}`;
  sseClients.set(clientId, res);

  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  // Heartbeat every 30s
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
};

// Broadcast helper (called by mseWorker on each tick)
const broadcastPriceUpdate = (payload) => {
  const msg = `event: price_update\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((res) => res.write(msg));
};
```

### Redis Cache-Aside Pattern
```js
// market.service.js
const getQuote = async (ticker) => {
  const cacheKey = `price:${ticker}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss — fetch from external
  const quote = await alphaVantageService.getStockQuote(ticker);
  await redis.setex(cacheKey, 60, JSON.stringify(quote)); // TTL: 60s
  return quote;
};
```

### Frontend Auth State
```js
// authSlice.js — no token in state, no localStorage
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false, isLoading: true },
  ...
});

// App.jsx — hydrate on load
const dispatch = useDispatch();
useEffect(() => {
  dispatch(authApi.endpoints.getMe.initiate())
    .unwrap()
    .then(user => dispatch(setUser(user)))
    .catch(() => dispatch(clearUser()))
    .finally(() => dispatch(setLoading(false)));
}, []);
```

### RTK Query Base Config
```js
// apiSlice.js
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',  // sends HTTP-Only cookie automatically
});
```

---

## Dependencies to Install

### Backend (apps/api)
- `zod` — request validation
- `ioredis` — Redis client
- `bullmq` — background job queue
- `cookie-parser` — read HTTP-Only cookies in Express
- `express-rate-limit` — rate limiting

### Frontend (apps/ui)
No new dependencies needed for Phase 1. RTK Query is already available via `@reduxjs/toolkit`.

---

## Migration Safety Rules
1. New `/api/v1/*` routes are additive — they don't replace existing `/api/*` routes during Phase 1.
2. The old `Holding` model, `holdingsController`, and `/api/holdings/*` routes are untouched.
3. The new `Transaction` model does not conflict with anything existing.
4. The `User` model gets one new field (`role`) added non-destructively with a default.
5. Cookie auth is a new auth path — existing Bearer token middleware remains for the old routes.
