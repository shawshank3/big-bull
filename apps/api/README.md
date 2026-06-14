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
│   │   ├── user.model.js      # Mongoose User schema (source of truth for the User entity)
│   │   ├── user.service.js    # getUserById, updateUserProfile, setUserAvatar, removeUserAvatar
│   │   ├── user.controller.js # getProfile, updateProfile, uploadProfileAvatar, removeProfileAvatar
│   │   └── user.routes.js     # /api/v1/users/*
│   ├── asset/         # Indian stock + MF catalog (Mongoose model + Zod validator)
│   ├── wallet/        # VirtualWallet — ₹10L starting balance per user
│   ├── transaction/   # BUY/SELL ledger — the single source of truth for portfolio values
│   ├── portfolio/     # Holdings + summary computed from transactions + Redis prices
│   ├── market/        # Assets, search, quotes, ticker strip, SSE stream
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
│   ├── bullmq.js      # BullMQ queue definitions
│   ├── chat.js        # Gemini model, generation config, system instruction
│   └── market.js      # Market constants
├── utils/
│   ├── jwt.js         # generateAccessToken, generateRefreshToken, verify*
│   ├── response.js    # sendSuccess(res, data, message, status)
│   └── avatarData.js  # validateAvatarData(avatar)
├── workers/
│   ├── mseWorker.js      # Market Simulation Engine — BullMQ 30s price tick (stocks only)
│   ├── mseLiveTicker.js  # In-process 1s SSE broadcast — micro-noise on stock prices
│   ├── redisBullMQ.js    # BullMQ-specific ioredis factory (maxRetriesPerRequest: null)
│   └── index.js          # Worker process entry point
└── server.js          # Express app — mounts /api/v1/* only
```

---

## Prerequisites

- **Node.js 18+**
- **MongoDB** — local (`mongod`) or MongoDB Atlas
- **Redis** _(optional)_ — prices fall back to `basePrice` if Redis is unavailable

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

| Variable              | Required | Default       | Description                                                                        |
| --------------------- | -------- | ------------- | ---------------------------------------------------------------------------------- |
| `MONGO_URI`           | ✅       | —             | MongoDB connection string                                                          |
| `MONGODB_URI`         | ✅       | —             | Alias checked by `validateEnv()` — set to the same value as `MONGO_URI`            |
| `JWT_SECRET`          | ✅       | —             | Access token signing secret (min 32 chars)                                         |
| `JWT_REFRESH_SECRET`  | ✅       | —             | Refresh token signing secret (must differ from `JWT_SECRET`)                       |
| `JWT_ACCESS_EXPIRES`  | —        | `30s`         | Access token lifetime — parsed by `parseExpiry()` for cookie `maxAge`              |
| `JWT_REFRESH_EXPIRES` | —        | `2h`          | Refresh token lifetime — parsed by `parseExpiry()` for cookie `maxAge`             |
| `PORT`                | —        | `4000`        | HTTP port                                                                          |
| `NODE_ENV`            | —        | `development` | Set to `production` on Render                                                      |
| `REDIS_URL`           | —        | —             | Redis connection string. If absent, caching is disabled and prices use `basePrice` |
| `GEMENI_API_KEY`      | —        | —             | Google AI Studio API key for the chat copilot                                      |

`JWT_ACCESS_EXPIRES` and `JWT_REFRESH_EXPIRES` accept the format `<number><unit>` where unit is `s`, `m`, `h`, or `d` (e.g. `30s`, `15m`, `2h`, `7d`). Cookie `maxAge` is derived from these values at runtime — there are no separate hardcoded constants.

---

## Seed the database

Populates 20 NSE stocks + 5 Indian mutual funds and creates a demo user with ₹10L wallet:

```bash
npm run seed
# Demo login: demo@bigbull.com / Demo@1234
```

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

Owns authentication flow only. Profile operations live under `/api/v1/users`.

| Method | Path        | Auth | Description                                                            |
| ------ | ----------- | ---- | ---------------------------------------------------------------------- |
| POST   | `/register` | —    | Create account, issue HTTP-Only cookies, seed ₹10L wallet              |
| POST   | `/login`    | —    | Validate credentials, issue cookies                                    |
| POST   | `/logout`   | ✅   | Invalidate refresh token, clear cookies                                |
| GET    | `/me`       | ✅   | Current user `{ id, name, email, role }` — used for app-load hydration |
| POST   | `/refresh`  | —    | Rotate refresh token (reads cookie), issue new access cookie           |

### Users `/api/v1/users`

Profile and avatar management. All routes require authentication.

| Method | Path              | Auth | Description                                                   |
| ------ | ----------------- | ---- | ------------------------------------------------------------- |
| GET    | `/profile`        | ✅   | Full profile `{ id, name, email, phone, bio, avatar }`        |
| PATCH  | `/profile`        | ✅   | Partial update — any subset of `{ name, phone, bio, avatar }` |
| POST   | `/profile/avatar` | ✅   | Upload base64 data URL avatar                                 |
| DELETE | `/profile/avatar` | ✅   | Remove avatar (sets field to `null`)                          |

### Chat `/api/v1/chat`

Rate-limited: `generalLimiter` (100 requests / 15 min).

| Method | Path | Auth | Description                                      |
| ------ | ---- | ---- | ------------------------------------------------ |
| POST   | `/`  | ✅   | Send a message to the AI copilot (Google Gemini) |

**Request body:**

```json
{ "message": "What are my top holdings?" }
```

**Response 200:**

```json
{
  "success": true,
  "data": { "reply": "Your top holding is..." },
  "error": null,
  "timestamp": "..."
}
```

**Error responses:** 400 (missing/blank message), 502 (Gemini returned empty), 503 (API key not configured).

### Market `/api/v1/market`

All routes are **public** (no auth required) except the SSE stream.

| Method | Path              | Auth | Description                                                                              |
| ------ | ----------------- | ---- | ---------------------------------------------------------------------------------------- |
| GET    | `/assets`         | —    | Full asset catalog enriched with live Redis prices. `?type=STOCK\|MUTUAL_FUND` to filter |
| GET    | `/assets/:ticker` | —    | Single asset by NSE ticker or MF scheme code                                             |
| GET    | `/search?q=`      | —    | Full-text search over catalog (name + ticker, min 2 chars)                               |
| GET    | `/quote/:ticker`  | —    | Current simulated price from Redis cache or `basePrice` fallback                         |
| GET    | `/ticker`         | —    | Top 10 NSE stocks with live prices — used by the UI ticker strip                         |
| GET    | `/stream`         | ✅   | SSE endpoint — streams `price_update` and `volatility_alert` events                      |

### Transactions `/api/v1/transactions`

| Method | Path     | Auth | Description                                                       |
| ------ | -------- | ---- | ----------------------------------------------------------------- |
| GET    | `/`      | ✅   | Paginated transaction history (`?page=1&limit=20`)                |
| POST   | `/order` | ✅   | Execute BUY or SELL — atomically updates wallet and writes ledger |

**Order body:**

```json
{
  "assetId": "<MongoDB _id>",
  "transactionType": "BUY",
  "quantity": 10,
  "pricePerUnit": 2950.0,
  "fees": 0
}
```

### Portfolio `/api/v1/portfolio`

Values are computed on demand — nothing is stored. Source: Transaction ledger + Redis price cache.

| Method | Path        | Auth | Description                                                                                                                      |
| ------ | ----------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/holdings` | ✅   | Per-asset: `{ assetId, asset, netQuantity, avgCostBasis, currentPrice, currentValue, totalInvested, unrealizedPnL, pnlPercent }` |
| GET    | `/summary`  | ✅   | Aggregate: `{ totalInvested, currentValue, totalPnL, pnlPercent, cashBalance }`                                                  |

### Wallet `/api/v1/wallet`

| Method | Path | Auth | Description                      |
| ------ | ---- | ---- | -------------------------------- |
| GET    | `/`  | ✅   | Current ₹ virtual wallet balance |

---

## Live Price Architecture

Stock prices update every second. Mutual fund NAVs are fixed for the day. Two-layer design keeps DB overhead low:

| Layer      | Component                        | Interval  | What it does                                                                                                                                                                                              |
| ---------- | -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistent | `mseWorker.js` (BullMQ)          | Every 30s | Fetches all assets from MongoDB, computes new prices using `Price_t = Price_{t-1} × (1 + Sm + Ts + Va×N)`, writes `price:<ticker>` to Redis (TTL 60s), broadcasts SSE, decays MarketSentiment/SectorTrend |
| Live UI    | `mseLiveTicker.js` (setInterval) | Every 1s  | Applies micro-noise to the in-memory price cache (no DB/Redis writes), broadcasts SSE `price_update` for STOCK assets only — skips `MUTUAL_FUND`                                                          |

**Redis keys used by MSE:**

| Key pattern                | TTL    | Purpose                                             |
| -------------------------- | ------ | --------------------------------------------------- |
| `price:<ticker>`           | 60s    | Latest authoritative price written by BullMQ worker |
| `mse:marketSentiment`      | No TTL | Global sentiment scalar, decays 10% per tick        |
| `mse:sectorTrend:<sector>` | No TTL | Per-sector trend scalar, decays 10% per tick        |

**BullMQ requires a separate ioredis connection** (`maxRetriesPerRequest: null`). The shared `redis.js` cache client (`maxRetriesPerRequest: 3`) must not be passed to `new Worker()` or `new Queue()`. Use `makeBullMQConnection()` from `shared/redisBullMQ.js` instead.

---

## Key Design Rules

- **User module owns the User entity.** The `auth` module handles authentication flow and calls `user.service.js` when it needs user data. No other module imports `user.model.js` directly.
- **Transactions are the single source of truth.** Portfolio values are never stored — always computed by aggregating the Transaction ledger.
- **No external market APIs.** All data (search, quotes, ticker) comes from the seeded Asset catalog + Redis price cache populated by the MSE worker.
- **Cookie auth only.** JWTs live in HTTP-Only cookies. No Bearer tokens. The frontend never reads the raw token value.
- **Cookie lifetime from env vars.** `parseExpiry(process.env.JWT_ACCESS_EXPIRES)` and `parseExpiry(process.env.JWT_REFRESH_EXPIRES)` are called at request time to compute cookie `maxAge` — no hardcoded constants.
- **Frontend mirrors backend modules.** The React SPA uses the same vertical module boundaries: `auth`, `user`, `market`, `portfolio`, `transaction`, `wallet`, `chat`. Each frontend feature owns its API slice, DTOs, components, hooks, and routes — see `apps/ui/README.md`.

---

## Scripts

| Command        | Description                                       |
| -------------- | ------------------------------------------------- |
| `npm run dev`  | Start with nodemon (auto-restart on file changes) |
| `npm start`    | Start production server                           |
| `npm run seed` | Seed 20 NSE stocks + 5 MFs + demo user            |
| `npm test`     | Run Jest test suite                               |
