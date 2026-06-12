# BigBull API — Backend

Node.js + Express REST API for the BigBull simulated Indian stock market platform.

## Architecture

Feature-module vertical structure. Each domain lives in `src/modules/<feature>/` containing its own model, validator, service, controller, and routes.

```
apps/api/src/
├── modules/
│   ├── auth/          # Cookie-based JWT auth (register, login, logout, me, refresh)
│   ├── asset/         # Indian stock + MF catalog (Mongoose model + Zod validator)
│   ├── wallet/        # VirtualWallet — ₹10L starting balance per user
│   ├── transaction/   # BUY/SELL ledger — the source of truth for all portfolio values
│   ├── portfolio/     # Holdings + summary computed from transactions + Redis prices
│   └── market/        # Search, quotes, ticker, SSE stream — all from internal catalog
├── shared/            # catchAsync, AppError, Redis singleton
├── middleware/        # authMiddleware (cookie), rateLimiter, errorHandler
├── config/            # database, bullmq queue definitions
├── workers/           # mseWorker (price tick skeleton), index (worker entry point)
├── routes/            # Legacy /api/* routes (backward compat)
├── controllers/       # Legacy horizontal controllers (kept for old routes)
└── server.js          # Express app — mounts both /api/v1/* and legacy /api/*
```

## Prerequisites

- **Node.js 18+**
- **MongoDB** — local (`mongod`) or Atlas
- **Redis** *(optional)* — prices fall back to `basePrice` if unavailable

No external market data API keys needed. All prices are simulated internally.

## Setup

```bash
cd apps/api
pnpm install        # or: npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET at minimum
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (different from JWT_SECRET) |
| `PORT` | — | HTTP port (default `4000`) |
| `NODE_ENV` | — | `development` or `production` |
| `REDIS_URL` | — | Redis connection string. If absent, caching is disabled and prices use basePrice |
| `GEMENI_API_KEY` | — | Google Gemini key for the AI chat copilot |

## Seed the database

Populates 20 NSE stocks + 5 Indian mutual funds and creates a demo user with ₹10L wallet:

```bash
npm run seed
# Demo login: demo@bigbull.com / Demo@1234
```

## Run

```bash
npm run dev    # nodemon — auto-restarts on file changes
npm start      # production
```

API base: `http://localhost:4000`

## API Reference

All v1 responses use the unified envelope:
```json
{ "success": true, "data": {}, "error": null, "timestamp": "..." }
```

Auth uses **HTTP-Only cookies** — no Bearer tokens.

### Auth `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account, set cookies, seed wallet |
| POST | `/login` | — | Validate credentials, set cookies |
| POST | `/logout` | ✅ | Clear cookies |
| GET | `/me` | ✅ | Current user profile (used for app hydration) |
| POST | `/refresh` | — | Rotate refresh token, issue new access token |

### Market `/api/v1/market` (all public)

| Method | Path | Description |
|---|---|---|
| GET | `/assets` | List all seeded assets. `?type=STOCK\|MUTUAL_FUND` |
| GET | `/assets/:ticker` | Single asset by NSE ticker |
| GET | `/search?q=` | Full-text search over catalog (min 2 chars) |
| GET | `/quote/:ticker` | Current simulated price from Redis or basePrice |
| GET | `/ticker` | Top 10 NSE stocks with live prices (ticker strip) |
| GET | `/stream` | SSE stream — live price_update events *(auth required)* |

### Transactions `/api/v1/transactions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Paginated transaction history (`?page=&limit=`) |
| POST | `/order` | ✅ | Execute BUY or SELL — atomically updates wallet |

**Order body:**
```json
{
  "assetId": "<MongoDB _id>",
  "transactionType": "BUY",
  "quantity": 10,
  "pricePerUnit": 2950.00,
  "fees": 0
}
```

### Portfolio `/api/v1/portfolio`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/holdings` | ✅ | Transaction-derived holdings with live P&L |
| GET | `/summary` | ✅ | Total invested, current value, P&L, cash balance |

### Wallet `/api/v1/wallet`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Current ₹ balance |

## Key Design Rules

- **Transactions are the only source of truth.** Portfolio values are never stored — always computed by aggregating the Transaction ledger.
- **No external APIs.** All market data (search, quotes, ticker) comes from the seeded Asset catalog + Redis price cache populated by the MSE worker.
- **Cookie auth.** JWTs live in HTTP-Only cookies. The frontend never reads the raw token.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Seed demo assets and user |
