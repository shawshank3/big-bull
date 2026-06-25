# BigBull API

Express REST API powering a virtual stock market simulation. Handles user auth, order execution, wallet management, portfolio aggregation, market price simulation via BullMQ workers, and real-time SSE price streaming. All prices are INR (₹) virtual currency generated internally — no external market APIs.

---

## Stack

| Technology         | Role                                 | Version |
| ------------------ | ------------------------------------ | ------- |
| Express            | HTTP framework                       | ^4.22   |
| MongoDB/Mongoose   | Primary data store                   | ^7.3    |
| Redis (ioredis)    | Price cache, BullMQ transport        | ^5.11   |
| BullMQ             | 30s market simulation tick scheduler | ^5.78   |
| JSON Web Tokens    | Cookie-based authentication          | ^9.0    |
| bcryptjs           | Password hashing (10 rounds)         | ^2.4    |
| Zod                | Request validation                   | ^4.4    |
| @google/genai      | AI Copilot (Gemini)                  | ^2.7    |
| cookie-parser      | HTTP-Only cookie handling            | ^1.4    |
| express-rate-limit | Request throttling                   | ^8.5    |
| dotenv             | Environment variable loading         | ^16.6   |

---

## Architecture

```
apps/api/
├── index.js                    # Entry point: env validation, server listen, graceful shutdown
└── src/
    ├── server.js               # Express app: middleware stack, route registration, DB connect
    ├── config/
    │   ├── bullmq.js           # BullMQ queue factory (mse-price-tick queue)
    │   ├── chat.js             # Gemini AI model config
    │   ├── database.js         # MongoDB connection via Mongoose
    │   └── market.js           # Search min length, result limits
    ├── middleware/
    │   ├── authMiddleware.js   # JWT cookie verification → req.user
    │   ├── errorHandler.js     # Global error → JSON envelope
    │   └── rateLimiter.js      # general, auth, chat rate limiters
    ├── modules/
    │   ├── asset/              # Model + validator (catalog, no routes)
    │   ├── auth/               # Register, login, logout, refresh, me
    │   ├── chat/               # AI Copilot (Gemini) conversation
    │   ├── market/             # Assets, quotes, search, SSE stream, charts
    │   ├── portfolio/          # Holdings aggregation, P&L summary
    │   ├── tax/                # Capital gains (FIFO), tax-loss harvesting
    │   ├── transaction/        # Order execution, trade history
    │   ├── user/               # Profile CRUD, avatar
    │   └── wallet/             # Balance, debit/credit, wallet tx history
    ├── shared/
    │   ├── constants/          # Domain enums (11 files)
    │   ├── AppError.js         # Operational error class with statusCode
    │   ├── catchAsync.js       # Async handler wrapper
    │   ├── pagination.js       # POST pagination helpers (Zod schema + meta builder)
    │   ├── redis.js            # Shared ioredis client (no-op stub if unconfigured)
    │   └── redisBullMQ.js      # BullMQ-specific ioredis (maxRetriesPerRequest: null)
    ├── utils/
    │   ├── avatarData.js       # Default avatar data
    │   ├── http.js             # HTTP helpers
    │   ├── jwt.js              # generateAccessToken, generateRefreshToken, verifyRefreshToken
    │   └── response.js         # sendSuccess / sendError — standard envelope
    └── workers/
        ├── index.js            # Worker orchestration
        ├── mseWorker.js        # BullMQ 30s authoritative price computation
        ├── mseLiveTicker.js    # 1s interpolated SSE broadcast
        └── dailyPriceService.js# Shutdown close + startup backfill
```

---

## Request Lifecycle

Every HTTP request traverses the same pipeline. Example: `POST /api/v1/transactions/order`

```
HTTP Request
    │
    ▼
┌─ Global Middleware ────────────────────────────────────┐
│  1. trust proxy                                        │
│  2. cors (credentials: true)                           │
│  3. cookieParser                                       │
│  4. setNoCacheHeaders                                  │
│  5. express.json (3 MB limit)                          │
│  6. express.urlencoded (3 MB limit)                    │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Route-Level Middleware ──────────────────────────────┐
│  7. generalLimiter (/api/v1/*)                        │
│  8. authMiddleware (reads access_token cookie → JWT)  │
└───────────────────────────────────────────────────────┘
    │
    ▼
┌─ Controller: transaction.controller.executeOrder ─────┐
│  • Validates request body with Zod schema             │
│  • Calls transaction.service.executeOrder(userId, …)  │
└───────────────────────────────────────────────────────┘
    │
    ▼
┌─ Service: transaction.service.executeOrder ───────────┐
│  • Resolves execution price (asset-aware: stock 3-tier / MF DailyPrice) │
│  • Pre-flight checks (balance / holdings)             │
│  • Opens MongoDB session                              │
│  • Creates Transaction document                       │
│  • Calls wallet.service.debit() or .credit()          │
│  • Commits session (or aborts on failure)             │
└───────────────────────────────────────────────────────┘
    │
    ▼
┌─ Response ────────────────────────────────────────────┐
│  sendSuccess(res, data, message, statusCode)          │
│  → { success, message, data, error, timestamp }       │
└───────────────────────────────────────────────────────┘
```

If any layer throws an `AppError` (or any uncaught error), the global `errorHandler` middleware catches it and returns a standardised error envelope.

---

## Module Map

| Module          | Domain Responsibility                         | Files                                                                                                                                                                                                                                | Owned Routes           |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **auth**        | Register, login, logout, refresh, identity    | `auth.controller.js`, `auth.routes.js`, `auth.service.js`, `auth.validator.js`                                                                                                                                                       | `/api/v1/auth`         |
| **user**        | Profile CRUD, avatar upload/delete            | `user.controller.js`, `user.routes.js`, `user.service.js`, `user.model.js`                                                                                                                                                           | `/api/v1/users`        |
| **wallet**      | Cash balance, debit/credit, wallet tx history | `wallet.controller.js`, `wallet.routes.js`, `wallet.service.js`, `wallet.model.js`                                                                                                                                                   | `/api/v1/wallet`       |
| **transaction** | Execute BUY/SELL orders, order history        | `transaction.controller.js`, `transaction.routes.js`, `transaction.service.js`, `transaction.model.js`, `transaction.validator.js`                                                                                                   | `/api/v1/transactions` |
| **portfolio**   | Holdings aggregation, P&L summary             | `portfolio.controller.js`, `portfolio.routes.js`, `portfolio.service.js`                                                                                                                                                             | `/api/v1/portfolio`    |
| **market**      | Asset catalog, quotes, search, SSE, charts    | `market.controller.js`, `market.routes.js`, `market.service.js`, `market.validator.js`, `chart.controller.js`, `chart.service.js`, `chart.validator.js`, `marketState.model.js`, `stockPriceHistory.model.js`, `dailyPrice.model.js` | `/api/v1/market`       |
| **asset**       | Asset model + validator (catalog data)        | `asset.model.js`, `asset.validator.js`                                                                                                                                                                                               | None (reference data)  |
| **chat**        | AI Copilot — Gemini conversation              | `chat.controller.js`, `chat.routes.js`, `chat.service.js`                                                                                                                                                                            | `/api/v1/chat`         |
| **tax**         | Capital gains tracking, tax-loss harvesting   | `tax.controller.js`, `tax.routes.js`, `tax.service.js`, `tax.validator.js`                                                                                                                                                           | `/api/v1/tax`          |
| **insights**    | Public platform-wide statistics (cached)      | `insights.controller.js`, `insights.routes.js`, `insights.service.js`, `insights.model.js`                                                                                                                                           | `/api/v1/insights`     |

---

## Database Ownership

| Collection            | Owning Module | Authorised Writer(s)                                                                                                                                               | Write Conditions                      |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `users`               | auth / user   | `auth.service.register()`, `user.service.update*()`                                                                                                                | Create on register; update on profile |
| `assets`              | asset         | Seed script only (`scripts/seed.js`)                                                                                                                               | Setup-only, never runtime             |
| `virtualwallets`      | wallet        | `wallet.service.debit()`, `wallet.service.credit()`                                                                                                                | Atomic `$inc` within session          |
| `transactions`        | transaction   | `transaction.service.executeOrder()`                                                                                                                               | Create (immutable, never updated)     |
| `marketstates`        | market (MSE)  | `mseWorker` bulk-upsert (stocks only), `dailyPriceService.backfillMissingDays()` (stocks only)                                                                     | Upsert on every 30s tick + startup    |
| `stockpricehistories` | market (MSE)  | `mseWorker` insertMany, `dailyPriceService.backfillIntradayToday()`                                                                                                | Append-only (48h TTL index)           |
| `dailyprices` (stock) | market (MSE)  | `mseWorker` per-tick upsert of today's record, `dailyPriceService.writeTodayClose()` (shutdown safety net), `backfillMissingDays()` (past-day gap fill on startup) | Upsert per ticker per day             |
| `dailyprices` (MF)    | market (MSE)  | `dailyPriceService.ensureMfDailyPrices()` — sole writer (startup + day rollover)                                                                                   | Upsert per ticker per day             |
| `appinsights`         | insights      | `insights.service.getInsights()` — upserts single cached document                                                                                                  | Upsert (recomputes every 5 min)       |

---

## Market Simulation Flow

The system uses **two distinct pricing pipelines** depending on asset type.

### Stocks: continuous intraday simulation (two layers)

**Layer 1 — Authoritative Tick (mseWorker, every 30s via BullMQ)**

Per-tick operations in order (stocks only):

1. Fetch all STOCK assets from MongoDB
2. Detect IST day transition; on rollover trigger MF NAV refresh (stocks need no extra action — see step 12 below)
3. Read global MarketSentiment and SectorTrend values from Redis
4. Resolve previous price (three-tier chain), compute new price using `Price_t = Price_{t-1} × (1 + Sm + Ts + Va × N)` where N is Gaussian noise
5. Write updated price to Redis (`price:<ticker>`, TTL 60s)
6. Broadcast SSE `price_update` event to all connected clients
7. Emit `volatility_alert` if single-tick swing > 3%
8. Seed the live ticker in-memory cache
9. Persist MarketState (bulk upsert) — recovery tier
10. Append StockPriceHistory documents — intraday charting
11. Decay MarketSentiment and SectorTrends by 10% toward zero
12. Bulk-upsert today's DailyPrice with the latest computed price — keeps multi-day charts ending on the current price; the last tick before IST midnight becomes the day's official close

**Layer 2 — Live Ticker (mseLiveTicker, every 1s via setInterval)**

- Applies micro-noise (scaled to 1/√30 of volatility) to in-memory cached stock prices
- Broadcasts SSE `price_update` per stock to all clients
- No database reads, no Redis writes — pure in-process interpolation

### Mutual funds: one NAV per IST day

Mutual funds change exactly once per IST day. They have **no Redis, no MarketState, no SSE** — the most recent `DailyPrice` record IS the current NAV.

`dailyPriceService.ensureMfDailyPrices()` is the sole writer of MF DailyPrice records:

- For each MF, finds the most recent DailyPrice and chain-simulates a random walk forward to today (inclusive).
- Idempotent: if today already exists, the function is a no-op.
- Called on **startup** (fills any offline days plus today) and on **IST midnight rollover** (from `mseWorker.handleDayTransition()`).

The chart's last point and the quote's `price` for an MF are guaranteed identical because both read today's `DailyPrice.closePrice`.

### Persistence Targets

| Target                 | Writer                       | Trigger                                                                       |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Redis `price:<ticker>` | mseWorker, dailyPriceService | Every 30s tick (stocks); reseeded on stock backfill                           |
| MarketState            | mseWorker, dailyPriceService | Every 30s tick (stocks); updated on stock backfill                            |
| StockPriceHistory      | mseWorker, dailyPriceService | Every 30s tick (stocks); intraday backfill on startup                         |
| DailyPrice (stock)     | mseWorker, dailyPriceService | Per-tick upsert of today; shutdown safety net; startup gap-fill for past days |
| DailyPrice (MF)        | dailyPriceService            | `ensureMfDailyPrices()` on startup + IST midnight rollover                    |

---

## Price Resolution Chain

When the system needs the current price for an asset (order execution, portfolio valuation, quote API), it dispatches by asset type via `market.service.resolveAssetPrice(asset)`.

### Stocks — three-tier chain

```
Tier 1: Redis  →  price:<ticker> (JSON, TTL 60s)
        ↓ miss or unavailable
Tier 2: MarketState.lastPrice  →  MongoDB, survives restarts and Redis flushes
        ↓ miss or unavailable
Tier 3: Asset.basePrice  →  seed/reference value, never written at runtime
```

| Tier | Source              | Staleness Window | Fallback Behavior                               |
| ---- | ------------------- | ---------------- | ----------------------------------------------- |
| 1    | Redis               | 60s TTL          | Key expires if no tick for 60s → fall to Tier 2 |
| 2    | MarketState (Mongo) | Until next tick  | Used after Redis flush or server restart        |
| 3    | Asset.basePrice     | Permanent seed   | Last resort — only on first-ever boot           |

### Mutual funds — single source

```
Tier 1: Today's DailyPrice.closePrice  →  the chart's last point
        ↓ briefly missing during cold-start
Tier 2: Most recent DailyPrice.closePrice
        ↓ no DailyPrice exists at all (fresh install before ensure ran)
Tier 3: Asset.basePrice
```

`Asset.basePrice` is never written at runtime in either chain. It serves purely as the original seed value.

---

## Prerequisites

- Node.js ≥ 18
- pnpm (monorepo workspace manager)
- MongoDB (local or Atlas)
- Redis (local or Upstash) — optional, app runs with degraded caching if absent

---

## Setup

```bash
# From monorepo root
pnpm install

# Copy environment template
cp apps/api/.env.example apps/api/.env
# Edit .env with your values (see Environment Variables below)
```

---

## Environment Variables

| Variable              | Required | Default       | Description                                           |
| --------------------- | -------- | ------------- | ----------------------------------------------------- |
| `PORT`                | No       | `4000`        | HTTP listen port                                      |
| `MONGODB_URI`         | Yes      | —             | MongoDB connection string                             |
| `JWT_SECRET`          | Yes      | —             | Access token signing secret                           |
| `JWT_REFRESH_SECRET`  | Yes      | —             | Refresh token signing secret (must differ from above) |
| `JWT_ACCESS_EXPIRES`  | No       | `30s`         | Access token lifetime                                 |
| `JWT_REFRESH_EXPIRES` | No       | `2h`          | Refresh token lifetime                                |
| `REDIS_URL`           | No       | —             | Redis connection string (app runs without it)         |
| `GEMENI_API_KEY`      | No       | —             | Google Gemini API key for AI Copilot                  |
| `CORS_ORIGIN`         | No       | `true` (all)  | Allowed CORS origin                                   |
| `NODE_ENV`            | No       | `development` | Environment flag (affects cookie `secure` flag)       |

`validateEnv()` in `index.js` crashes the process if `MONGODB_URI`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` are missing.

---

## Seed

```bash
cd apps/api
pnpm seed          # upsert 100 stocks + 15 mutual funds + demo user (idempotent)
pnpm seed:force    # drop all assets first, then re-seed from scratch
```

Seeds 100 NSE stocks + 15 mutual funds into the `assets` collection and creates a demo user.

| What                    | Value                            |
| ----------------------- | -------------------------------- |
| Demo login              | `demo@bigbull.com` / `Demo@1234` |
| Starting wallet balance | ₹10,00,000                       |
| Stocks seeded           | 100 (NSE-listed companies)       |
| Mutual funds seeded     | 15 (Indian direct-growth funds)  |

For historical chart data:

```bash
pnpm seed:history          # requires empty collections
pnpm seed:history-force    # drops & re-seeds
```

---

## Run

```bash
# Development (with nodemon)
pnpm dev

# Production
pnpm start
```

Server starts at `http://localhost:4000`. On startup:

1. Connects to MongoDB
2. Ensures all mutual-fund DailyPrice records are current (through today)
3. Backfills any missing stock DailyPrice records from downtime days
4. Backfills today's intraday StockPriceHistory ticks so the 1D chart is not empty
5. Starts BullMQ mse-price-tick scheduler (30s interval)
6. Starts live ticker (1s SSE broadcast)

On graceful shutdown (SIGTERM/SIGINT): writes today's stock closing prices to DailyPrice before exiting. Mutual fund NAVs are already persisted by `ensureMfDailyPrices()` and need no shutdown action.

---

## API Reference

All routes are prefixed with `/api/v1/` unless noted. Standard response envelope:

```json
{ "success": true, "message": "...", "data": { ... }, "error": null, "timestamp": "ISO-8601" }
```

### Auth (`/api/v1/auth`)

| Method | Path             | Auth     | Body / Params                                              | Response `data`                       |
| ------ | ---------------- | -------- | ---------------------------------------------------------- | ------------------------------------- |
| POST   | `/auth/register` | Public   | `{ name, email, password }` — pw ≥8 chars, digit + special | `{ user: { id, name, email, role } }` |
| POST   | `/auth/login`    | Public   | `{ email, password }`                                      | `{ user: { id, name, email, role } }` |
| POST   | `/auth/refresh`  | Public   | None (reads `refresh_token` cookie)                        | `{ user: { id, name, email, role } }` |
| POST   | `/auth/logout`   | Required | None                                                       | `null`                                |
| GET    | `/auth/me`       | Required | None                                                       | `{ user: { id, name, email, role } }` |

### User (`/api/v1/users`)

| Method | Path                    | Auth     | Body / Params                      | Response `data`                           |
| ------ | ----------------------- | -------- | ---------------------------------- | ----------------------------------------- |
| GET    | `/users/profile`        | Required | None                               | `{ id, name, email, phone, bio, avatar }` |
| PATCH  | `/users/profile`        | Required | `{ name?, phone?, bio?, avatar? }` | `{ id, name, email, phone, bio, avatar }` |
| POST   | `/users/profile/avatar` | Required | `{ avatar }` — base64 data-URL     | `{ id, name, email, phone, bio, avatar }` |
| DELETE | `/users/profile/avatar` | Required | None                               | `{ id, name, email, phone, bio, avatar }` |

### Wallet (`/api/v1/wallet`)

| Method | Path                        | Auth     | Body / Params                                                                    | Response `data`                   |
| ------ | --------------------------- | -------- | -------------------------------------------------------------------------------- | --------------------------------- |
| GET    | `/wallet`                   | Required | None                                                                             | `{ balance, currency }`           |
| POST   | `/wallet/transactions/list` | Required | `{ pagination: { page, limit }, filters?: { type?: "DEBIT"\|"CREDIT" }, sort? }` | Paginated `{ items, pagination }` |
| GET    | `/wallet/transactions`      | Required | Query: `?page=1&limit=20` (legacy)                                               | `{ transactions, pagination }`    |

### Transactions (`/api/v1/transactions`)

| Method | Path                  | Auth     | Body / Params                                                                                                                                                                             | Response `data`                   |
| ------ | --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| POST   | `/transactions/order` | Required | `{ assetId, transactionType: "BUY"\|"SELL", quantity, fees?, notes? }` — price resolved server-side. STOCK `quantity` must be an integer; MUTUAL_FUND allows fractional units (min 0.001) | `{ transaction }`                 |
| POST   | `/transactions/list`  | Required | `{ pagination: { page, limit }, filters?: { assetId?, transactionType? }, search?, sort? }`                                                                                               | Paginated `{ items, pagination }` |
| GET    | `/transactions`       | Required | Query: `?page=1&limit=20&assetId=` (legacy)                                                                                                                                               | `{ transactions, pagination }`    |

### Portfolio (`/api/v1/portfolio`)

| Method | Path                  | Auth     | Body / Params | Response `data`                                  |
| ------ | --------------------- | -------- | ------------- | ------------------------------------------------ |
| GET    | `/portfolio/holdings` | Required | None          | `{ holdings }`                                   |
| GET    | `/portfolio/summary`  | Required | None          | Portfolio summary (invested, current, P&L, cash) |

### Market (`/api/v1/market`)

| Method | Path                     | Auth   | Body / Params                                                                        | Response `data`                                               |
| ------ | ------------------------ | ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| GET    | `/market/ticker`         | Public | None                                                                                 | Live ticker quotes for top stocks                             |
| GET    | `/market/assets`         | Public | Query: `?type=STOCK\|MUTUAL_FUND` (legacy)                                           | `{ assets }` — enriched with live prices                      |
| POST   | `/market/assets/list`    | Public | `{ pagination: { page, limit }, filters?: { assetType?, sector? }, search?, sort? }` | Paginated `{ items, pagination }`                             |
| GET    | `/market/assets/:ticker` | Public | Path param: ticker (NSE symbol)                                                      | `{ asset }`                                                   |
| GET    | `/market/search`         | Public | Query: `?q=` — min 2 chars, max 100                                                  | `{ results }`                                                 |
| GET    | `/market/quote/:ticker`  | Public | Path param: ticker                                                                   | Quote object with live price                                  |
| GET    | `/market/stream`         | Public | None (SSE connection)                                                                | SSE events: `connected`, `price_update`, `volatility_alert`   |
| GET    | `/market/chart/:ticker`  | Public | Path param: ticker; Query: `?range=1D\|1W\|1M\|3M\|1Y`                               | `{ ticker, assetType, range, granularity, points, baseline }` |

### Insights (`/api/v1/insights`)

| Method | Path        | Auth   | Body / Params | Response `data`                                           |
| ------ | ----------- | ------ | ------------- | --------------------------------------------------------- |
| GET    | `/insights` | Public | None          | `{ stockCount, mutualFundCount, userCount, totalTrades }` |

### Chat (`/api/v1/chat`)

| Method | Path    | Auth     | Body / Params             | Response `data` |
| ------ | ------- | -------- | ------------------------- | --------------- |
| POST   | `/chat` | Required | `{ message }` — non-empty | `{ reply }`     |

### Tax (`/api/v1/tax`)

> **Educational only** — This module provides simulated capital gains tracking and tax-loss harvesting insights. It performs zero database writes and reads exclusively from existing `transactions` and `assets` collections.

| Method | Path              | Auth     | Query Params                    | Response `data`                  |
| ------ | ----------------- | -------- | ------------------------------- | -------------------------------- |
| GET    | `/tax/gains`      | Required | `?taxYear=2025&page=1&limit=20` | `{ gains, summary, pagination }` |
| GET    | `/tax/summary`    | Required | `?taxYear=2025`                 | `{ totalSTCG, totalLTCG, ... }`  |
| GET    | `/tax/harvesting` | Required | `?taxYear=2025&minLoss=0`       | `{ opportunities, meta }`        |

**Query Parameters:**

| Param     | Type   | Default    | Description                                                 |
| --------- | ------ | ---------- | ----------------------------------------------------------- |
| `taxYear` | number | Current FY | Indian FY start year (e.g., 2025 = Apr 2025–Mar 2026)       |
| `page`    | number | 1          | Page number (gains endpoint only)                           |
| `limit`   | number | 20         | Items per page, max 100 (gains endpoint only)               |
| `minLoss` | number | 0          | Minimum unrealized loss threshold for harvesting filter (₹) |

**Response Shapes:**

`GET /tax/gains` returns:

```json
{
  "gains": [{ "assetId", "ticker", "name", "assetType", "buyDate", "sellDate", "quantity", "buyPrice", "sellPrice", "gain", "gainType", "holdingDays" }],
  "summary": { "totalSTCG", "totalLTCG", "netRealizedGain" },
  "pagination": { "page", "limit", "total", "totalPages" }
}
```

`GET /tax/summary` returns:

```json
{ "totalSTCG", "totalLTCG", "netRealizedGain", "stcgTax", "ltcgTax", "estimatedTax", "harvestingCount", "taxYear" }
```

`GET /tax/harvesting` returns:

```json
{
  "opportunities": [{ "assetId", "ticker", "name", "assetType", "sector", "unrealizedLoss", "currentPrice", "avgCostBasis", "quantity", "holdingDays", "lossType", "estimatedSaving", "offsetsGainType" }],
  "meta": { "minLoss", "totalOpportunities" }
}
```

**Key Design Notes:**

- Uses FIFO lot matching to compute realized gains per BUY/SELL pair
- Classifies gains as STCG (< 12 months) or LTCG (≥ 12 months)
- Tax rates: STCG 20%, LTCG 12.5% above ₹1,25,000 exemption
- Harvesting identifies current holdings with unrealized losses
- Read-only — no writes to any collection

### Health (`/api/health`)

| Method | Path          | Auth   | Body / Params | Response `data`                                    |
| ------ | ------------- | ------ | ------------- | -------------------------------------------------- |
| GET    | `/api/health` | Public | None          | `{ version, db }` — returns 503 if DB disconnected |

### POST Pagination Convention

All list endpoints share a common request body:

```json
{
  "pagination": { "page": 1, "limit": 20 },
  "filters": {},
  "search": "",
  "sort": { "field": "createdAt", "order": "desc" }
}
```

Response includes `{ items, pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }`. Default limit is 5, maximum is 100.

### Rate Limiting

| Limiter          | Scope          | Window | Max Requests |
| ---------------- | -------------- | ------ | ------------ |
| `generalLimiter` | `/api/v1/*`    | 1 min  | 1000         |
| `authLimiter`    | `/api/v1/auth` | 1 min  | 1000         |
| `chatLimiter`    | `/api/v1/chat` | 1 min  | 1000         |

---

## Feature Creation Guide

To add a new feature module (e.g., `watchlist`):

1. **Create directory**: `src/modules/watchlist/`
2. **Model**: `watchlist.model.js` — define Mongoose schema with appropriate indexes
3. **Validator**: `watchlist.validator.js` — define Zod schemas for request validation
4. **Service**: `watchlist.service.js` — all business logic; call other services (never import other models directly)
5. **Controller**: `watchlist.controller.js` — validate input with Zod, call service, format response via `sendSuccess()`
6. **Routes**: `watchlist.routes.js` — Express router, apply `authMiddleware` per route as needed
7. **Register**: In `src/server.js`, import and mount the router:
   ```js
   const v1WatchlistRoutes = require('./modules/watchlist/watchlist.routes');
   app.use('/api/v1/watchlist', v1WatchlistRoutes);
   ```
8. **Constants**: If new enums are needed, add to `shared/constants/` and export via `shared/constants/index.js`

---

## Key Design Rules

- **Cookie-only auth** — JWTs stored exclusively in HTTP-Only cookies, never in response bodies or localStorage. Prevents XSS token theft.
- **Transaction as source of truth** — Portfolio holdings and P&L are always computed on-demand from raw Transaction documents via aggregation pipeline. No stored derived values, no stale-cache bugs.
- **No external APIs** — All market prices are generated internally by the MSE worker. No Alpha Vantage, Yahoo Finance, or MFAPI calls at runtime. Self-contained simulation with no API keys to manage.
- **Shared constants** — Domain enums (asset types, transaction types, chart ranges, HTTP status) live in `shared/constants/` and are imported by both API and UI packages. Single source of truth for magic values.
- **Standardised POST pagination** — All list endpoints use POST with `{ pagination, filters, search, sort }` body. Complex filters don't fit in query params; consistent client contract across all modules.
- **Module isolation** — Each module owns its routes, controller, service, and model. Cross-module calls go through the service layer only. Never import another module's model directly.
- **Server-resolved execution price** — `transaction.service.executeOrder()` discards any client-supplied price. Price is resolved server-side via the three-tier chain. Prevents client-side price manipulation.
- **Atomic order execution** — Every BUY/SELL wraps Transaction creation + wallet update in a single MongoDB session. No partial states.
- **Asset-type quantity rules** — `transaction.service.executeOrder()` enforces that STOCK quantities are whole integers (`Number.isInteger`); MUTUAL_FUND allows fractional units (min 0.001). The check runs after asset resolution and rejects fractional stock orders with HTTP 400.
- **INR-only virtual currency** — All monetary values in ₹. No multi-currency support.
