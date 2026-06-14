# BigBull — Monorepo

A pnpm-workspace monorepo containing the full BigBull stack: a React 19 + Vite 5 frontend (`apps/ui`) and a Node.js + Express 4 backend (`apps/api`).

BigBull is a **simulated Indian stock market platform** — users get a virtual ₹10L wallet and can trade NSE stocks and mutual funds against internally simulated prices, track their portfolio P&L, and chat with an AI copilot powered by Google Gemini.

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

### 4. Start development servers

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

| Variable              | App | Required | Default                     | Description                                                                     |
| --------------------- | --- | -------- | --------------------------- | ------------------------------------------------------------------------------- |
| `MONGO_URI`           | API | ✅       | —                           | MongoDB connection string                                                       |
| `MONGODB_URI`         | API | ✅       | —                           | Same value as `MONGO_URI` (alias checked by `validateEnv()`)                    |
| `JWT_SECRET`          | API | ✅       | —                           | Access token signing secret                                                     |
| `JWT_REFRESH_SECRET`  | API | ✅       | —                           | Refresh token signing secret (must differ from `JWT_SECRET`)                    |
| `JWT_ACCESS_EXPIRES`  | API | —        | `30s`                       | Access token lifetime (`s`, `m`, `h`, `d` units)                                |
| `JWT_REFRESH_EXPIRES` | API | —        | `2h`                        | Refresh token lifetime                                                          |
| `PORT`                | API | —        | `4000`                      | Express server port                                                             |
| `NODE_ENV`            | API | —        | `development`               | Set to `production` on Render                                                   |
| `REDIS_URL`           | API | —        | —                           | Redis connection string. If absent, price caching is disabled                   |
| `GEMENI_API_KEY`      | API | —        | —                           | [Google AI Studio](https://aistudio.google.com/apikey) key for the chat copilot |
| `VITE_API_URL`        | UI  | —        | `http://localhost:4000/api` | API base URL (production only; dev uses Vite proxy)                             |
| `VITE_APP_NAME`       | UI  | —        | `BigBull`                   | App display name                                                                |

---

## Other Scripts

```bash
pnpm build          # Build frontend → apps/ui/dist/
pnpm start          # Start API in production mode
pnpm --filter api test   # Run API Jest test suite
pnpm --filter ui test    # Run UI Jest test suite
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
  features/market      ──► /api/v1/market/*       (assets, search, quotes, ticker, SSE stream)
  features/portfolio   ──► /api/v1/portfolio/*    (holdings, summary)
  features/transaction ──► /api/v1/transactions/* (history, executeOrder)
  features/wallet      ──► /api/v1/wallet         (balance)
  features/chat        ──► /api/v1/chat           (AI copilot)
  shared/api           ──  RTK Query base slice + baseQueryWithReauth mutex wrapper
  shared/layout        ──  RootLayout (mounts SSE stream), Navbar, AppPageLayout, PageHeader
  shared/ui            ──  Design-system primitives (Button, Card, Badge, Spinner …)
  shared/errors        ──  RouteErrorBoundary, NotFoundCard
        │
        │ HTTPS + SSE
        ▼
Express API (Node.js)
  /modules/auth        → register, login, logout, me, refresh (auth flow only)
  /modules/user        → User schema, profile CRUD, avatar (owns the User entity)
  /modules/asset       → asset model and validation (shared by market + seeder)
  /modules/market      → assets, search, quote, ticker, SSE stream (/market/stream)
  /modules/transaction → BUY/SELL order execution, history
  /modules/portfolio   → holdings + summary (computed, never stored)
  /modules/wallet      → virtual ₹ balance
  /modules/chat        → Google Gemini with portfolio context
        │
        ├── MongoDB Atlas   (transactions, users, assets, wallet)
        └── Redis (Upstash) (price cache 60s TTL, BullMQ queues, MarketSentiment/SectorTrend)
                │
                └── BullMQ Worker (MSE price tick — every 30s)
                        + MSE Live Ticker (in-process setInterval — every 1s, stocks only)
```

**Key design rules:**

- Frontend and backend share the same vertical module boundaries: `auth`, `user`, `market`, `portfolio`, `transaction`, `wallet`, `chat`. Each frontend feature owns its API slice, DTOs, components, hooks, and routes.
- The `user` module owns the User entity. The `auth` module handles authentication and calls into `user.service` — it does not own user data.
- Transactions are the only source of truth for portfolio values — nothing is pre-computed and stored.
- All market data comes from the seeded internal asset catalog — no external market API calls.
- JWTs live in HTTP-Only cookies only — the frontend never reads the raw token.
- **Live prices:** Stock prices update every second via SSE (`price_update` events). Mutual fund NAVs are fixed for the day (updated once daily). The `useMarketStream` hook in `features/market/hooks/` patches the RTK Query cache in-place so all pages re-render without polling.

---

## Real-Time Price Architecture

```
BullMQ mseWorker (every 30s)
  ├── Fetches all assets from MongoDB
  ├── Reads MarketSentiment + SectorTrend from Redis
  ├── Computes new price per STOCK asset (formula: Price_t = Price_{t-1} × (1 + Sm + Ts + Va×N))
  ├── Writes price:<ticker> to Redis (TTL 60s)
  ├── Broadcasts SSE price_update per asset
  ├── Seeds in-memory price cache in mseLiveTicker
  └── Decays Sentiment/SectorTrend by 10%

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

## Documentation

See `apps/api/README.md` and `apps/ui/README.md` for per-app details.  
Architecture and planning documents live in `BigBull - Plan/` (sibling directory).

---

## License

MIT — see LICENSE files in each app directory.
