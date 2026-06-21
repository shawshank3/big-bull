# BigBull API — Backend

Node.js + Express 4 REST API for the BigBull simulated Indian stock market platform.

## Stack

| Layer          | Library / Tool                                 |
| -------------- | ---------------------------------------------- |
| Runtime        | Node.js 18+                                    |
| Framework      | Express 4                                      |
| Database       | MongoDB via Mongoose 7                         |
| Cache / Queues | Redis (ioredis) + BullMQ                       |
| Auth           | HTTP-Only JWT cookies (jsonwebtoken, bcryptjs) |
| Validation     | Zod (schema-first, per module)                 |
| AI             | Google Gemini (`@google/genai`)                |
| Testing        | Jest + fast-check (property-based tests)       |

---

## Architecture

Vertical feature-module structure. Each domain lives in `src/modules/<feature>/` and owns its model, validator, service, controller, and routes. No cross-module model imports — modules communicate through services only.

**Ownership principle:** The `user` module owns the User entity and all profile operations. The `auth` module handles authentication only — it calls into `user.service.js` when it needs user data. No other module imports the User model directly.

```
apps/api/src/
├── modules/
│   ├── auth/          # register, login, logout, me, refresh — auth logic only
│   │   ├── auth.controller.js
│   │   ├── auth.service.js    # issueAuthCookies, clearAuthCookies, validateCredentials
│   │   ├── auth.routes.js     # /api/v1/auth/*
│   │   └── auth.validator.js
│   ├── user/          # User entity — schema, profile CRUD, avatar management
│   │   ├── user.model.js
│   │   ├── user.service.js
│   │   ├── user.controller.js
│   │   └── user.routes.js     # /api/v1/users/*
│   ├── asset/         # Indian stock + MF catalog (Mongoose model + Zod validator)
│   ├── wallet/        # VirtualWallet — ₹10L starting balance per user
│   ├── transaction/   # BUY/SELL ledger — source of truth for portfolio values
│   ├── portfolio/     # Holdings + summary computed from transactions + three-tier price chain
│   ├── market/        # Assets, search, quotes, ticker, chart, SSE stream
│   │   ├── market.controller.js
│   │   ├── market.service.js      # resolvePrice() — three-tier chain exported
│   │   ├── market.routes.js
│   │   ├── market.validator.js
│   │   ├── chart.controller.js    # GET /market/chart/:ticker
│   │   ├── chart.service.js       # getChart() — reads StockPriceHistory + DailyPrice
│   │   ├── chart.validator.js
│   │   ├── stockPriceHistory.model.js  # intraday 30s ticks (stocks, 48h TTL)
│   │   ├── dailyPrice.model.js         # daily closing price / NAV per asset
│   │   └── marketState.model.js        # latest runtime price per ticker (recovery)
│   └── chat/          # AI copilot — Google Gemini with live portfolio context
├── shared/
│   ├── catchAsync.js     # Wraps async handlers — forwards rejections to errorHandler
│   ├── AppError.js       # Operational error class with statusCode
│   ├── redis.js          # ioredis singleton for cache ops (maxRetriesPerRequest: 3)
│   └── redisBullMQ.js    # ioredis factory for BullMQ (maxRetriesPerRequest: null)
├── middleware/
│   ├── authMiddleware.js  # Reads + verifies access_token cookie, attaches req.user
│   ├── rateLimiter.js     # generalLimiter (100/15 min), authLimiter (5/15 min)
│   └── errorHandler.js    # Global Express error handler
├── config/
│   ├── database.js    # Mongoose connection
│   ├── bullmq.js      # Queue definitions: mse-price-tick, net-worth-snapshot, goal-status-sync
│   ├── chat.js        # Gemini model, generation config, system instruction
│   └── market.js      # Market constants
├── utils/
│   ├── jwt.js         # generateAccessToken, generateRefreshToken, verify*
│   ├── response.js    # sendSuccess(res, data, message, status)
│   └── avatarData.js  # validateAvatarData(avatar)
├── workers/
│   ├── mseWorker.js          # MSE 30s price tick — writes Redis, StockPriceHistory, MarketState
│   ├── mseLiveTicker.js      # In-process 1s SSE broadcast — micro-noise on stock prices
│   ├── dailyPriceService.js  # writeTodayClose() on shutdown + backfillMissingDays() on startup
│   └── index.js              # Standalone worker process entry point
└── server.js          # Express app — mounts /api/v1/* only
```

---

## Prerequisites

- **Node.js 18+**
- **MongoDB** — local (`mongod`) or MongoDB Atlas
- **Redis** _(optional)_ — BullMQ workers and price caching require Redis. Without it, prices fall back to `MarketState` then `Asset.basePrice`.

No external market data API keys are needed. All prices are simulated internally by the MSE worker.

---

## Setup

```bash
cd apps/api
pnpm install        # or: npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET at minimum
```

---

## Environment Variables

| Variable              | Required | Default       | Description                                                               |
| --------------------- | -------- | ------------- | ------------------------------------------------------------------------- |
| `MONGO_URI`           | ✅       | —             | MongoDB connection string                                                 |
| `MONGODB_URI`         | ✅       | —             | Alias checked by `validateEnv()` — set to the same value as `MONGO_URI`   |
| `JWT_SECRET`          | ✅       | —             | Access token signing secret (min 32 chars)                                |
| `JWT_REFRESH_SECRET`  | ✅       | —             | Refresh token signing secret (must differ from `JWT_SECRET`)              |
| `JWT_ACCESS_EXPIRES`  | —        | `30s`         | Access token lifetime — parsed by `parseExpiry()` for cookie `maxAge`     |
| `JWT_REFRESH_EXPIRES` | —        | `2h`          | Refresh token lifetime — parsed by `parseExpiry()` for cookie `maxAge`    |
| `PORT`                | —        | `4000`        | HTTP port                                                                 |
| `NODE_ENV`            | —        | `development` | Set to `production` on Render                                             |
| `REDIS_URL`           | —        | —             | Redis connection string. If absent, caching + BullMQ workers are disabled |
| `GEMENI_API_KEY`      | —        | —             | Google AI Studio API key for the chat copilot                             |

---

## Seed the database

**Step 1 — Assets + demo user:**

```bash
npm run seed
# Demo login: demo@bigbull.com / Demo@1234
```

**Step 2 — Historical chart data (optional, local dev only):**

Backfills 30 days of synthetic price history into `dailyprices`, `stockpricehistories`, and `marketstates`:

```bash
npm run seed:history -- --force
```

Options:

| Flag       | Description                                                                     |
| ---------- | ------------------------------------------------------------------------------- |
| `--force`  | Clears the three collections first, then seeds. Required if they are non-empty. |
| `--days N` | Seed N days of history (default: 30). e.g. `--days 60`                          |

> `scripts/seedHistoricalData.js` is gitignored — it is a local development utility and should not be committed.

Without `seed:history`, charts still work — 1D intraday data builds up live as the `mseWorker` fires every 30 seconds. Multi-day ranges (1W/1M/3M/1Y) populate once the server shuts down gracefully (writing today's close) or on the next boot (backfilling any gap days).

---

## Run

```bash
npm run dev     # nodemon — auto-restarts on file changes
npm start       # Production
npm test        # Jest (property tests + unit tests)
```

API base: `http://localhost:4000`

---

## API Reference

All v1 responses use the unified envelope:

```json
{ "success": true, "data": {}, "error": null, "timestamp": "..." }
```

Auth uses **HTTP-Only cookies** — no Bearer tokens in any response body or request header.

### Health

| Method | Path          | Description                                                             |
| ------ | ------------- | ----------------------------------------------------------------------- |
| GET    | `/api/health` | Returns `{ version, db: "connected" }` or 503 if MongoDB is unreachable |

### Auth `/api/v1/auth`

Rate-limited: 5 requests / 15 min per IP.

| Method | Path        | Auth | Description                                                            |
| ------ | ----------- | ---- | ---------------------------------------------------------------------- |
| POST   | `/register` | —    | Create account, issue HTTP-Only cookies, seed ₹10L wallet              |
| POST   | `/login`    | —    | Validate credentials, issue cookies                                    |
| POST   | `/logout`   | ✅   | Invalidate refresh token, clear cookies                                |
| GET    | `/me`       | ✅   | Current user `{ id, name, email, role }` — used for app-load hydration |
| POST   | `/refresh`  | —    | Rotate refresh token (reads cookie), issue new access cookie           |

### Users `/api/v1/users`

| Method | Path              | Auth | Description                                                   |
| ------ | ----------------- | ---- | ------------------------------------------------------------- |
| GET    | `/profile`        | ✅   | Full profile `{ id, name, email, phone, bio, avatar }`        |
| PATCH  | `/profile`        | ✅   | Partial update — any subset of `{ name, phone, bio, avatar }` |
| POST   | `/profile/avatar` | ✅   | Upload base64 data URL avatar                                 |
| DELETE | `/profile/avatar` | ✅   | Remove avatar (sets field to `null`)                          |

### Market `/api/v1/market`

All routes are **public** (no auth required).

| Method | Path              | Auth | Description                                                                        |
| ------ | ----------------- | ---- | ---------------------------------------------------------------------------------- |
| GET    | `/assets`         | —    | Full asset catalog enriched with live prices. `?type=STOCK\|MUTUAL_FUND` to filter |
| GET    | `/assets/:ticker` | —    | Single asset by NSE ticker or MF scheme code                                       |
| GET    | `/search?q=`      | —    | Full-text search over catalog (name + ticker, min 2 chars)                         |
| GET    | `/quote/:ticker`  | —    | Current simulated price (Redis → MarketState → basePrice)                          |
| GET    | `/ticker`         | —    | Top 10 NSE stocks with live prices — used by the UI ticker strip                   |
| GET    | `/chart/:ticker`  | —    | Historical price series. `?range=1D\|1W\|1M\|3M\|1Y`                               |
| GET    | `/stream`         | —    | SSE endpoint — streams `price_update` and `volatility_alert` events                |

#### Chart endpoint detail

`GET /api/v1/market/chart/:ticker?range=1D|1W|1M|3M|1Y`

Response shape:

```json
{
  "ticker": "RELIANCE",
  "assetType": "STOCK",
  "range": "1D",
  "granularity": "30s",
  "points": [
    {
      "timestamp": "2026-06-21T03:45:00.000Z",
      "price": 2963.41,
      "change": 13.41,
      "changePercent": "+0.46%"
    }
  ]
}
```

| Range                     | Data source                                                 | Granularity |
| ------------------------- | ----------------------------------------------------------- | ----------- |
| `1D` (Stock)              | `StockPriceHistory` — today's intraday ticks                | 30 seconds  |
| `1D` (MF)                 | `DailyPrice` — today's NAV only (MFs have no intraday data) | Daily       |
| `1W` / `1M` / `3M` / `1Y` | `DailyPrice` — daily closing prices                         | Daily       |

### Transactions `/api/v1/transactions`

| Method | Path     | Auth | Description                                                       |
| ------ | -------- | ---- | ----------------------------------------------------------------- |
| GET    | `/`      | ✅   | Paginated transaction history (`?page=1&limit=20&assetId=<opt>`)  |
| POST   | `/order` | ✅   | Execute BUY or SELL — atomically updates wallet and writes ledger |

### Portfolio `/api/v1/portfolio`

Computed on demand — nothing stored. Source: Transaction ledger + three-tier price chain.

| Method | Path        | Auth | Description                                                         |
| ------ | ----------- | ---- | ------------------------------------------------------------------- |
| GET    | `/holdings` | ✅   | Per-asset holdings with live price, P&L, and portfolio weight       |
| GET    | `/summary`  | ✅   | Aggregate: `{ totalInvested, currentValue, totalPnL, cashBalance }` |

### Wallet `/api/v1/wallet`

| Method | Path | Auth | Description                      |
| ------ | ---- | ---- | -------------------------------- |
| GET    | `/`  | ✅   | Current ₹ virtual wallet balance |

### Chat `/api/v1/chat`

| Method | Path | Auth | Description                                      |
| ------ | ---- | ---- | ------------------------------------------------ |
| POST   | `/`  | ✅   | Send a message to the AI copilot (Google Gemini) |

---

## Price Architecture — Three-Tier Recovery Chain

Every price read in the system (mseWorker, portfolio, market, transactions) resolves via:

```
1. Redis  price:<ticker>  (TTL 60s)   — fastest, most current
2. MarketState.lastPrice  (MongoDB)   — survived Redis flush / server restart
3. Asset.basePrice                    — original seed value, last resort
```

`MarketState` is upserted by the `mseWorker` after every tick. On a fresh boot with an empty Redis, the simulation resumes from the last known persisted price rather than reverting to seed values.

`Asset.basePrice` is **never written at runtime** — it is pure reference/seed data.

---

## MongoDB Collections

| Collection            | Owner                | Purpose                                             |
| --------------------- | -------------------- | --------------------------------------------------- |
| `users`               | `user` module        | User accounts and profiles                          |
| `assets`              | `asset` module       | Tradeable instrument catalog (seed only)            |
| `transactions`        | `transaction` module | BUY/SELL ledger — source of truth for portfolio     |
| `virtualwallets`      | `wallet` module      | Per-user cash balance                               |
| `stockpricehistories` | `mseWorker`          | Intraday 30s price ticks for STOCK assets (48h TTL) |
| `dailyprices`         | `dailyPriceService`  | One closing price per asset per calendar day        |
| `marketstates`        | `mseWorker`          | Latest runtime price per ticker (recovery layer)    |

---

## DailyPrice Lifecycle

`DailyPrice` records are written by `dailyPriceService.js` — no BullMQ queue or cron involved:

| Trigger                                  | Function                | What it writes                                                                                    |
| ---------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Graceful shutdown (`SIGTERM` / `SIGINT`) | `writeTodayClose()`     | Upserts today's `DailyPrice` per asset using the current three-tier price                         |
| Server startup (after `connectDB()`)     | `backfillMissingDays()` | Fills every calendar day between last known `DailyPrice` and yesterday via random-walk simulation |

**Downtime recovery behaviour:**

| Scenario                                 | What happens                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server runs then shuts down normally     | `writeTodayClose()` fires — today's last price is persisted                                                                                                            |
| Server runs 12:00–12:15, then shuts down | Same — 12:15's `MarketState` price becomes that day's `DailyPrice`                                                                                                     |
| Server restarts the same day             | `backfillMissingDays()` skips today (fills up to yesterday only). Next shutdown overwrites today's record with the latest price                                        |
| Server offline all day                   | On next boot: yesterday gets `MarketState.lastPrice` as its close                                                                                                      |
| Server offline for N days                | On next boot: N gap days filled by chaining random-walk from `MarketState.lastPrice`; `MarketState` updated to end-of-chain price so live simulation resumes correctly |
| Cold DB — no `MarketState` either        | Falls back to `Asset.basePrice`, fills 30 days of synthetic history                                                                                                    |
| Redis flushed / Upstash reset            | `backfillMissingDays()` bypasses Redis entirely — uses `MarketState` directly                                                                                          |
| `writeTodayClose()` fails at shutdown    | Error logged, process exits cleanly. Next boot fills the gap as "yesterday"                                                                                            |
| Server crashes (SIGKILL / OOM)           | No graceful shutdown — same recovery as "server offline all day"                                                                                                       |
| `backfillMissingDays()` fails on startup | Error logged, server continues normally. Live simulation unaffected                                                                                                    |

---

## BullMQ Workers

| Queue                | Worker file           | Schedule  | Purpose                                                                                          |
| -------------------- | --------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `mse-price-tick`     | `mseWorker.js`        | Every 30s | Stock price simulation, Redis writes, SSE broadcast, StockPriceHistory + MarketState persistence |
| `net-worth-snapshot` | _(planned — Phase 3)_ | Daily     | Net worth snapshot per user                                                                      |
| `goal-status-sync`   | _(planned — Phase 3)_ | Daily     | Goal status recalculation                                                                        |

> `dailyPriceService.js` is **not** a BullMQ worker — it is a plain async module called directly at startup and shutdown. No queue, no cron, no Redis dependency for scheduling.

**BullMQ requires a separate ioredis connection** (`maxRetriesPerRequest: null`). Use `makeBullMQConnection()` from `shared/redisBullMQ.js` — never pass the shared `redis.js` client to a Queue or Worker.

---

## Key Design Rules

- **User module owns the User entity.** No other module imports `user.model.js` directly.
- **Transactions are the single source of truth.** Portfolio values are never stored — always computed by aggregating the Transaction ledger.
- **No external market APIs.** All data comes from the seeded Asset catalog + MSE simulation.
- **Cookie auth only.** JWTs live in HTTP-Only cookies. No Bearer tokens.
- **Historical collections are read-only for the API.** `StockPriceHistory` and `DailyPrice` are written exclusively by workers, never by HTTP handlers.
- **`Asset.basePrice` is read-only at runtime.** It is set during seeding and never updated by the simulation.
- **Three-tier price resolution.** Redis → MarketState → basePrice — applied consistently everywhere.

---

## Scripts

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start with nodemon (auto-restart on file changes)      |
| `npm start`            | Start production server                                |
| `npm run seed`         | Seed 20 NSE stocks + 5 MFs + demo user                 |
| `npm run seed:history` | Backfill 30 days of historical chart data (gitignored) |
| `npm test`             | Run Jest test suite                                    |
