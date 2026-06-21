# BigBull — Monorepo

A pnpm-workspace monorepo containing the full BigBull stack: a React 19 + Vite 5 frontend (`apps/ui`) and a Node.js + Express 4 backend (`apps/api`).

BigBull is a **simulated Indian stock market platform** — users get a virtual ₹10L wallet and can trade NSE stocks and mutual funds against internally simulated prices, track their portfolio P&L, view historical price charts, and chat with an AI copilot powered by Google Gemini.

---

## Monorepo Structure

```
big-bull/
├── apps/
│   ├── ui/                  React 19 + Vite 5 SPA
│   │                        Dev server: http://localhost:5173
│   │                        Proxies /api → http://localhost:4000 in dev
│   └── api/                 Node.js + Express 4 REST API
│                            Server: http://localhost:4000
├── pnpm-workspace.yaml      Declares apps/* as workspace packages
├── render.yaml              Render Blueprint — one-click full-stack deploy
├── package.json             Root scripts: dev, build, start, install:all
├── .env.example             All env vars for both apps with inline comments
└── .gitignore
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/installation) v9 or later

```bash
npm install -g pnpm
```

### 1. Install dependencies

```bash
pnpm install
```

This installs dependencies for both `apps/ui` and `apps/api` in a single pass from the workspace root.

### 2. Configure environment variables

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` — at minimum, set:

| Variable                    | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `MONGO_URI` + `MONGODB_URI` | MongoDB connection string (set both to the same value) |
| `JWT_SECRET`                | Long random string for signing access tokens           |
| `JWT_REFRESH_SECRET`        | Different long random string for refresh tokens        |

Everything else has working defaults for local development.

### 3. Seed the database

Populates 20 NSE stocks + 5 Indian mutual funds and creates a demo user:

```bash
pnpm --filter api seed
# Demo login: demo@bigbull.com / Demo@1234
```

### 4. (Optional) Seed historical chart data

Backfills 30 days of synthetic price history so charts render immediately:

```bash
pnpm --filter api seed:history -- --force
```

> This script is gitignored and intended for local development only. See `apps/api/README.md` for full options.

### 5. Start development servers

```bash
pnpm dev
```

| Process           | URL                   |
| ----------------- | --------------------- |
| Frontend (Vite)   | http://localhost:5173 |
| Backend (nodemon) | http://localhost:4000 |

The Vite dev server proxies all `/api` requests to `http://localhost:4000` — no CORS configuration or hardcoded origins needed.

---

## Environment Variables

### Full reference

| Variable              | App | Required | Default                     | Description                                                                       |
| --------------------- | --- | -------- | --------------------------- | --------------------------------------------------------------------------------- |
| `MONGO_URI`           | API | ✅       | —                           | MongoDB connection string                                                         |
| `MONGODB_URI`         | API | ✅       | —                           | Same value as `MONGO_URI` (alias checked by `validateEnv()`)                      |
| `JWT_SECRET`          | API | ✅       | —                           | Access token signing secret                                                       |
| `JWT_REFRESH_SECRET`  | API | ✅       | —                           | Refresh token signing secret (must differ from `JWT_SECRET`)                      |
| `JWT_ACCESS_EXPIRES`  | API | —        | `30s`                       | Access token lifetime (`s`, `m`, `h`, `d` units)                                  |
| `JWT_REFRESH_EXPIRES` | API | —        | `2h`                        | Refresh token lifetime                                                            |
| `PORT`                | API | —        | `4000`                      | Express server port                                                               |
| `NODE_ENV`            | API | —        | `development`               | Set to `production` on Render                                                     |
| `REDIS_URL`           | API | —        | —                           | Redis connection string. If absent, price caching and BullMQ workers are disabled |
| `GEMENI_API_KEY`      | API | —        | —                           | [Google AI Studio](https://aistudio.google.com/apikey) key for the chat copilot   |
| `VITE_API_URL`        | UI  | —        | `http://localhost:4000/api` | API base URL (production only; dev uses Vite proxy)                               |
| `VITE_APP_NAME`       | UI  | —        | `BigBull`                   | App display name                                                                  |

---

## Other Scripts

```bash
pnpm build                                # Build frontend → apps/ui/dist/
pnpm start                                # Start API in production mode
pnpm --filter api seed                    # Seed assets + demo user
pnpm --filter api seed:history -- --force # Seed 30 days of historical chart data
pnpm --filter api test                    # Run API Jest test suite
pnpm --filter ui test                     # Run UI Jest test suite
```

---

## Deployment (Render)

The `render.yaml` at the workspace root is a [Render Blueprint](https://render.com/docs/infrastructure-as-code). Connect this repository to Render once and both services are provisioned automatically.

| Render Service | Build                                    | Start                     |
| -------------- | ---------------------------------------- | ------------------------- |
| `big-bull`     | `pnpm install && pnpm --filter ui build` | `pnpm --filter api start` |

The built UI (`apps/ui/dist/`) is served as static files by the Express API on the same origin — no separate static hosting is needed.

### Required env vars on Render

Go to **Render Dashboard → big-bull → Environment** and set:

| Variable             | Notes                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| `MONGO_URI`          | MongoDB Atlas connection string                                                |
| `MONGODB_URI`        | Same value as `MONGO_URI`                                                      |
| `JWT_SECRET`         | Generate with `openssl rand -base64 64`                                        |
| `JWT_REFRESH_SECRET` | Generate separately with `openssl rand -base64 64`                             |
| `GEMENI_API_KEY`     | Google AI Studio key (optional — chat feature disabled without it)             |
| `REDIS_URL`          | Upstash Redis connection string (optional — prices use `basePrice` without it) |

`NODE_ENV=production` and `PORT=4000` are set automatically by `render.yaml`.

---

## Architecture Overview

```
React SPA (Vite) — feature-module architecture mirroring backend modules
  features/auth        ──► /api/v1/auth/*        (login, register, logout, me, refresh)
  features/user        ──► /api/v1/users/*        (profile, avatar)
  features/market      ──► /api/v1/market/*       (assets, search, quotes, ticker, chart, SSE stream)
  features/portfolio   ──► /api/v1/portfolio/*    (holdings, summary)
  features/transaction ──► /api/v1/transactions/* (history, executeOrder)
  features/wallet      ──► /api/v1/wallet         (balance)
  features/chat        ──► /api/v1/chat           (AI copilot)
  shared/api           ──  RTK Query base slice + baseQueryWithReauth mutex wrapper
  shared/layout        ──  RootLayout (mounts SSE stream), Navbar, AppPageLayout, PageHeader
  shared/ui            ──  Design-system primitives (Button, Card, Badge, LineChart, Spinner …)
  shared/errors        ──  RouteErrorBoundary, NotFoundCard
        │
        │ HTTPS + SSE
        ▼
Express API (Node.js)
  /modules/auth        → register, login, logout, me, refresh (auth flow only)
  /modules/user        → User schema, profile CRUD, avatar (owns the User entity)
  /modules/asset       → asset model and validation (shared by market + seeder)
  /modules/market      → assets, search, quote, ticker, chart, SSE stream (/market/stream)
                         models: StockPriceHistory, DailyPrice, MarketState
  /modules/transaction → BUY/SELL order execution, history
  /modules/portfolio   → holdings + summary (computed, never stored)
  /modules/wallet      → virtual ₹ balance
  /modules/chat        → Google Gemini with portfolio context
        │
        ├── MongoDB Atlas   (transactions, users, assets, wallet,
        │                    stockpricehistories, dailyprices, marketstates)
        └── Redis (Upstash) (price cache 60s TTL, BullMQ queues, MarketSentiment/SectorTrend)
                │
                └── BullMQ Workers
                      mseWorker      — 30s price tick (stocks), writes StockPriceHistory + MarketState
                    + mseLiveTicker  — in-process setInterval, 1s SSE broadcast (stocks only)
                    + dailyPriceService — startup backfill + graceful-shutdown close writer (no cron)
```

**Key design rules:**

- Frontend and backend share the same vertical module boundaries: `auth`, `user`, `market`, `portfolio`, `transaction`, `wallet`, `chat`. Each frontend feature owns its API slice, DTOs, components, hooks, and routes.
- The `user` module owns the User entity. The `auth` module handles authentication and calls into `user.service` — it does not own user data.
- Transactions are the only source of truth for portfolio values — nothing is pre-computed and stored.
- All market data comes from the seeded internal asset catalog — no external market API calls.
- JWTs live in HTTP-Only cookies only — the frontend never reads the raw token.
- **Live prices:** Stock prices update every second via SSE (`price_update` events). Mutual fund NAVs are fixed for the day. The `useMarketStream` hook patches the RTK Query cache in-place so all pages re-render without polling.
- **Price recovery:** On Redis miss or server restart, prices fall back through a three-tier chain: Redis → `MarketState.lastPrice` → `Asset.basePrice`. `Asset.basePrice` is strictly reference/seed data — `currentPrice` (resolved via the three-tier chain) is the live price reference everywhere. _(Phase 2)_
- **DailyPrice persistence:** On graceful shutdown (`SIGTERM`/`SIGINT`), `dailyPriceService.writeTodayClose()` upserts today's closing price for every asset before the process exits. On startup, `backfillMissingDays()` fills any gap days (server was offline) by chaining the random-walk simulation from the last known `MarketState` price.

---

## Real-Time Price Architecture

```
BullMQ mseWorker (every 30s)
  ├── Fetches all assets from MongoDB
  ├── Reads MarketSentiment + SectorTrend from Redis
  ├── Resolves previous price: Redis → MarketState → Asset.basePrice
  ├── Computes new price per STOCK asset (Price_t = Price_{t-1} × (1 + Sm + Ts + Va×N))
  ├── Writes price:<ticker> to Redis (TTL 60s)
  ├── Broadcasts SSE price_update per asset
  ├── Seeds in-memory price cache in mseLiveTicker
  ├── Bulk-upserts MarketState for all assets (runtime recovery)
  ├── Bulk-inserts StockPriceHistory for all STOCK assets (intraday charting)
  └── Decays Sentiment/SectorTrend by 10%

dailyPriceService — no cron, no BullMQ queue
  ├── backfillMissingDays()  — runs on startup after connectDB()
  │     ├── Finds last DailyPrice date per asset
  │     ├── Chains random-walk (Va × N) through each gap day
  │     ├── Writes DailyPrice records for all missing days up to yesterday
  │     └── Updates MarketState to end-of-gap price so live sim resumes correctly
  └── writeTodayClose()  — runs on SIGTERM / SIGINT before process.exit()
        ├── Resolves current price via three-tier chain per asset
        └── Upserts one DailyPrice record for today (idempotent)

mseLiveTicker (every 1s, in-process setInterval)
  ├── Skips MUTUAL_FUND assets (NAVs are daily)
  ├── Applies micro-noise (volatility × 0.18 × Gaussian)
  └── Broadcasts SSE price_update for all STOCK assets

Frontend useMarketStream hook (mounted in RootLayout)
  ├── Opens EventSource to /api/v1/market/stream
  └── On price_update → patches RTK Query cache:
        getStockQuote / getMutualQuote  → StockDetailContent / MutualDetailContent
        getTickerQuotes                 → TickerStrip
        getAssets                       → MarketContent (live price column)
        getPortfolioHoldings            → HoldingsContent (currentPrice, P&L, portfolioWeight)
        getPortfolioSummary             → Dashboard stat cards (currentValue, totalPnL, %)
```

---

## Historical Charts _(Phase 2)_

Stock and mutual fund detail pages include a price history chart backed by MongoDB. This work is part of Phase 2 alongside the AI Copilot v2 upgrade.

| Range             | Data source                                                        | Granularity |
| ----------------- | ------------------------------------------------------------------ | ----------- |
| 1D (Stock)        | `StockPriceHistory` — intraday 30s ticks written by `mseWorker`    | 30 seconds  |
| 1D (MF)           | `DailyPrice` — today's NAV (MFs have no intraday history)          | Daily       |
| 1W / 1M / 3M / 1Y | `DailyPrice` — daily closing prices written by `dailyPriceService` | Daily       |

The chart is served at `GET /api/v1/market/chart/:ticker?range=1D|1W|1M|3M|1Y`.

To backfill 30 days of synthetic data for immediate chart rendering:

```bash
npm run seed:history -- --force   # from apps/api/
```

---

## Documentation

See `apps/api/README.md` and `apps/ui/README.md` for per-app details.
Architecture and planning documents live in `BigBull - Plan/` (sibling directory).

---

## License

MIT — see LICENSE files in each app directory.
