# BigBull — Stock Market Simulation Platform

BigBull is a full-stack stock market simulation platform where users trade virtual stocks and mutual funds with ₹10,00,000 in simulated INR currency. The platform features a real-time market simulation engine that generates live price movements, SSE-streamed to the browser. Built as a pnpm monorepo with React (Vite) on the frontend and Express + MongoDB + Redis + BullMQ on the backend.

## Feature Status

| Feature           | Module Path                         | Status  |
| ----------------- | ----------------------------------- | ------- |
| Auth              | `apps/api/src/modules/auth`         | Done    |
| Market Simulation | `apps/api/src/workers/mseWorker.js` | Done    |
| Portfolio         | `apps/api/src/modules/portfolio`    | Done    |
| Transactions      | `apps/api/src/modules/transaction`  | Done    |
| Wallet            | `apps/api/src/modules/wallet`       | Done    |
| AI Chat           | `apps/api/src/modules/chat`         | Done    |
| Charts / History  | `apps/api/src/modules/market`       | Done    |
| Search            | `apps/api/src/modules/market`       | Done    |
| Capital Gains     | —                                   | Planned |
| AI Copilot v2     | —                                   | Planned |

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React + RTK Query)                        │
│                                                                           │
│    REST /api/v1/*              SSE /api/v1/market/stream                   │
│         │                              ▲                                  │
└─────────┼──────────────────────────────┼──────────────────────────────────┘
          │ HTTP requests                │ EventSource (price_update events)
          ▼                              │
┌───────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (single Node.js process)                 │
│                                                                           │
│  ┌─────────────────┐   ┌─────────────────────────┐                       │
│  │  REST Handlers  │   │  SSE Stream + Broadcast  │                       │
│  │  (controllers)  │   │  (sseClients Map)        │                       │
│  └────────┬────────┘   └────────────▲─────────────┘                       │
│           │                         │                                     │
│  ┌────────┼─────────────────────────┼────────────────────────────────┐    │
│  │  WORKERS (in-process)            │                                │    │
│  │                                  │                                │    │
│  │  mseWorker (30s BullMQ) ────► broadcasts price_update             │    │
│  │       │                                                           │    │
│  │       ├── seeds priceCache ──► mseLiveTicker (1s setInterval)     │    │
│  │       │                              │                            │    │
│  │       │                              └──► broadcasts price_update │    │
│  │       ▼                                                           │    │
│  └───────┼───────────────────────────────────────────────────────────┘    │
│          │                                                                │
└──────────┼────────────────────────────────────────────────────────────────┘
           │
    ┌──────┼──────────────────────┐
    ▼      ▼                      ▼
┌────────┐ ┌──────────┐  ┌──────────────┐
│MongoDB │ │  Redis   │  │ BullMQ Queue │
│        │ │          │  │              │
│users   │ │price:*   │  │mse-price-tick│
│assets  │ │(TTL 60s) │  │(repeat: 30s) │
│wallets │ │          │  │              │
│transact│ │mse:*     │  │              │
│market… │ │          │  │              │
└────────┘ └──────────┘  └──────────────┘
```

## Data Flow

### Three-Tier Price Resolution Chain

Every service resolves asset prices using the same fallback priority:

| Priority | Source                 | Freshness | Survives Restart |
| -------- | ---------------------- | --------- | ---------------- |
| 1        | Redis `price:<TICKER>` | ≤ 30s     | No               |
| 2        | MarketState.lastPrice  | ≤ 30s     | Yes              |
| 3        | Asset.basePrice (seed) | Static    | Yes              |

If Redis is unavailable, the system degrades gracefully through Tier 2 and Tier 3.

### Transaction as Source of Truth

Portfolio holdings and P&L are never stored — they are computed on demand by aggregating immutable Transaction documents and resolving live prices via the chain above. This eliminates stale-cache bugs and dual-write inconsistencies.

For full data model details, see [06-Data-Model-and-Source-of-Truth](../BigBull%20-%20Plan/06-Data-Model-and-Source-of-Truth.md).

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 11.5 (`corepack enable` to activate)
- **MongoDB** running locally or an Atlas connection string
- **Redis** (optional — app runs without it but disables live market simulation)

### Steps

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url> big-bull && cd big-bull
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set these required variables:

   | Variable              | Purpose                      | Required |
   | --------------------- | ---------------------------- | -------- |
   | `MONGO_URI`           | MongoDB connection string    | Yes      |
   | `JWT_SECRET`          | Access token signing key     | Yes      |
   | `JWT_ACCESS_EXPIRES`  | Token lifetime (e.g. `30s`)  | Yes      |
   | `JWT_REFRESH_EXPIRES` | Refresh lifetime (e.g. `2h`) | Yes      |
   | `GEMENI_API_KEY`      | Google Gemini AI (for chat)  | No       |
   | `PORT`                | Server port (default `4000`) | No       |

3. **Seed the database**

   ```bash
   pnpm --filter api seed
   ```

   Seeds 20 NSE stocks + 5 mutual funds into the `assets` collection and creates a demo user (`demo@bigbull.com` / `Demo@1234`). Each user gets a ₹10,00,000 virtual wallet on registration.

   For historical chart data (30 days of daily prices + intraday ticks):

   ```bash
   pnpm --filter api seed:history
   ```

4. **Start development servers**

   ```bash
   pnpm dev
   ```

   | Service   | URL                          |
   | --------- | ---------------------------- |
   | UI (Vite) | http://localhost:5173        |
   | API       | http://localhost:4000/api/v1 |

   The Vite dev server proxies `/api` requests to the Express backend.

## Deployment

BigBull deploys as a **single Render Web Service** using a Render Blueprint.

| Item           | Value                                         |
| -------------- | --------------------------------------------- |
| Config file    | [`render.yaml`](./render.yaml)                |
| Build command  | `pnpm install && pnpm --filter ui build`      |
| Start command  | `pnpm --filter api start`                     |
| Static serving | Express serves `apps/ui/dist/` + SPA fallback |

The build step compiles the Vite UI into static files. At runtime, Express serves those files alongside the API on the same origin — no separate static site or worker service.

### Required Render Environment Variables

| Variable              | Purpose                          |
| --------------------- | -------------------------------- |
| `NODE_ENV`            | Set to `production`              |
| `PORT`                | `4000`                           |
| `MONGO_URI`           | MongoDB Atlas connection string  |
| `JWT_SECRET`          | Access token signing key         |
| `JWT_ACCESS_EXPIRES`  | Token lifetime                   |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime           |
| `GEMENI_API_KEY`      | Google Gemini API key (optional) |

## Documentation Index

### BigBull Plan (Architecture & Design)

| Document                                                                                        | Description                                              |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [01-Project-Overview](../BigBull%20-%20Plan/01-Project-Overview.md)                             | Mission, target users, tech stack, currency scope        |
| [02-System-Knowledge-Map](../BigBull%20-%20Plan/02-System-Knowledge-Map.md)                     | Deployment model, full-stack data flow, SSE architecture |
| [03-Backend-Knowledge-Map](../BigBull%20-%20Plan/03-Backend-Knowledge-Map.md)                   | Module structure, request lifecycle, design rules        |
| [04-Frontend-Knowledge-Map](../BigBull%20-%20Plan/04-Frontend-Knowledge-Map.md)                 | Feature modules, RTK Query, SSE flow, state ownership    |
| [05-Market-Simulation-Engine](../BigBull%20-%20Plan/05-Market-Simulation-Engine.md)             | Price formula, mseWorker, DailyPrice lifecycle           |
| [06-Data-Model-and-Source-of-Truth](../BigBull%20-%20Plan/06-Data-Model-and-Source-of-Truth.md) | MongoDB collections, price chain, transaction-as-SoT     |
| [07-AI-Copilot](../BigBull%20-%20Plan/07-AI-Copilot.md)                                         | Gemini integration, context injection, boundaries        |
| [08-API-Reference](../BigBull%20-%20Plan/08-API-Reference.md)                                   | Complete route table with params and responses           |
| [09-Roadmap](../BigBull%20-%20Plan/09-Roadmap.md)                                               | Pending features: Capital Gains, AI Copilot v2           |

### App READMEs

| Document                                   | Description                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| [apps/api/README.md](./apps/api/README.md) | Backend knowledge map: lifecycle, modules, DB, MSE, API ref, design rules       |
| [apps/ui/README.md](./apps/ui/README.md)   | Frontend knowledge map: features, routing, RTK Query, SSE, state, design system |
