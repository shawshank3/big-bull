# BigBull UI

> React single-page application for BigBull — a virtual stock market simulation platform. Feature-module architecture with RTK Query data fetching, SSE real-time price updates, and cookie-based authentication.

## Stack

| Technology               | Role                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| React 19                 | UI library                                                                                 |
| Redux Toolkit            | Global state management (RTK Query cache only — no custom slices)                          |
| RTK Query                | Server data fetching, caching, mutations, and auth state derivation                        |
| React Router 6           | Client-side routing (`createBrowserRouter`)                                                |
| Vite 5                   | Build tool and dev server                                                                  |
| Tailwind CSS 3           | Utility-first styling                                                                      |
| Radix UI                 | Accessible headless primitives (Avatar, Dialog, Select, Tabs, Progress, Dropdown, Popover) |
| class-variance-authority | Component variant definitions                                                              |
| React Hook Form          | Form state management                                                                      |
| Recharts                 | Chart visualisations                                                                       |
| @tanstack/react-table    | Data table rendering (client + server paginated)                                           |
| Lucide React             | Icon library                                                                               |
| react-day-picker         | Headless calendar/date picker engine (powers `DateRangePicker`)                            |
| date-fns                 | Date formatting helpers used by the date range picker                                      |
| react-helmet-async       | Per-route `<title>`, `<meta>`, and Open Graph tag injection (`PageMeta` component)         |
| async-mutex              | Token refresh race-condition guard                                                         |

## Architecture

```
apps/ui/
├── public/                     # Static assets: favicon, brand icon, OG preview image, robots.txt, sitemap.xml
├── src/
│   ├── app/                    # App-level wiring
│   │   ├── store.js            # Redux store (apiSlice reducer + middleware only)
│   │   ├── router.jsx          # createBrowserRouter — all heavy routes lazy-loaded via route.lazy()
│   │   └── routes/             # App-level pages (NotFound, Disclaimer)
│   ├── features/               # Feature modules (domain-sliced)
│   │   ├── auth/               # Login, register, session, route guards
│   │   ├── market/             # Asset listing (infinite scroll), quotes, SSE stream, search, top movers
│   │   ├── portfolio/          # Holdings, dashboard summary, P&L, Top Gainers/Losers (from market)
│   │   ├── tax/                # Capital gains, tax-loss harvesting, intraday harvesting, slab rate config
│   │   ├── transaction/        # Buy/sell order execution
│   │   ├── wallet/             # Balance display, wallet transaction history
│   │   ├── chat/               # AI copilot (Gemini)
│   │   ├── explore/            # Asset discovery landing page
│   │   └── user/               # Profile management, avatar
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── api/apiSlice.js     # RTK Query base slice + reauth wrapper
│   │   ├── components/         # Composite components (table, tabs, sheet, select, card, popover, calendar, date-range-picker, PageMeta, SimBanner)
│   │   ├── constants/          # Routes, API URLs, asset types, SEO constants (SITE_URL, SITE_NAME, OG image), validation rules
│   │   ├── dto/helpers.js      # DTO primitives (str, num, bool, arr)
│   │   ├── errors/             # Error boundary, NotFoundCard
│   │   ├── hooks/              # useDebounce, useThemeMode
│   │   ├── layout/             # RootLayout, Navbar, Footer, GlobalLoader, PageShell, PageSuspense, PageHeader
│   │   ├── ui/                 # Design system primitives (see below)
│   │   └── utils/              # Formatters, localStorage, market/portfolio helpers, input filters
│   ├── lib/utils.js            # Tailwind cn() merge utility
│   ├── theme/                  # Theme constants + utilities
│   ├── App.jsx                 # Provider composition root
│   └── main.jsx                # Vite entry point (wraps tree in HelmetProvider for react-helmet-async)
└── index.html                  # Entry HTML (meta tags, favicon, font preloads, base OG/Twitter tags)
```

**Backend module mapping:** Each frontend feature module maps to a corresponding backend API module — `auth → /api/v1/auth`, `market → /api/v1/market`, `portfolio → /api/v1/portfolio`, `tax → /api/v1/tax`, `transaction → /api/v1/transactions`, `wallet → /api/v1/wallet`, `chat → /api/v1/chat`, `user → /api/v1/users`.

### Feature Module Internal Structure

```
features/<module>/
├── api/<module>Api.js       # RTK Query injectEndpoints
├── dto/<module>.dto.js      # Response → DTO transformers
├── components/              # UI components (private to module)
├── hooks/                   # Custom hooks (private unless exported via index.js)
├── routes/                  # Page-level components mounted by router
├── store/                   # Selectors (auth derives state from RTK Query cache)
├── constants/               # Module-specific constants
├── utils/                   # Module-specific helpers
└── index.js                 # Public barrel — only this is importable externally
```

**Rules:**

- Cross-feature imports use the barrel (`index.js`) only — never reach into another module's internals
- Each module owns its own API endpoints, DTOs, and components
- No custom Redux slices exist — all server state (including auth) lives in RTK Query cache
- Auth state is derived from the `getMe` query cache via `createSelector`-based selectors in `features/auth/store/authSelectors.js`

## Pages

| Route                         | Feature   | Auth       | Component       |
| ----------------------------- | --------- | ---------- | --------------- |
| `/`                           | auth      | Any        | `RootRedirect`  |
| `/login`                      | auth      | Guest only | `Login`         |
| `/register`                   | auth      | Guest only | `Register`      |
| `/dashboard`                  | portfolio | Protected  | `Dashboard`     |
| `/holdings`                   | portfolio | Protected  | `Holdings`      |
| `/profile`                    | user      | Protected  | `Profile`       |
| `/wallet`                     | wallet    | Protected  | `Wallet`        |
| `/tax`                        | tax       | Protected  | `TaxCenter`     |
| `/tax/harvesting`             | tax       | Protected  | `TaxHarvesting` |
| `/market`                     | market    | Public     | `Market`        |
| `/market/stocks/:symbol`      | market    | Public     | `StockDetail`   |
| `/market/mutuals/:schemeCode` | market    | Public     | `MutualDetail`  |
| `/search`                     | market    | Public     | `Search`        |
| `/explore`                    | explore   | Public     | `Explore`       |
| `/legal/disclaimer`           | app       | Public     | `Disclaimer`    |
| `*`                           | app       | Any        | `NotFound`      |

All routes except `/login`, `/register`, and `/` are lazy-loaded via React Router's `route.lazy()`. Each lazy function returns `{ Component }` — React Router resolves it during navigation via `startTransition`, with no manual `<Suspense>` boundary needed at the route level. `PageSuspense` is reserved for heavy intra-page components loaded via `React.lazy()` on user interaction.

- `GuestRoute` — wraps login/register; redirects to `/dashboard` if already authenticated. Shows `GlobalLoader` while auth state is resolving to prevent a flash of guest content.
- `ProtectedRoute` — wraps dashboard/holdings/profile/wallet; redirects to `/login` if unauthenticated. Shows `GlobalLoader` while auth state is resolving.

## Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- Backend API running on `http://localhost:4000` (proxied automatically by Vite)

## Setup

```bash
# From monorepo root
pnpm install

# Or from apps/ui/
pnpm install
```

## Environment Variables

| Variable        | Description                                                   | Default                     |
| --------------- | ------------------------------------------------------------- | --------------------------- |
| `VITE_API_URL`  | API base URL (used only if direct fetch needed outside proxy) | `http://localhost:4000/api` |
| `VITE_APP_NAME` | Application display name                                      | `BigBull`                   |

The Vite dev server proxies all `/api` requests to `http://localhost:4000` — no environment variables are required for local development.

## Run Commands

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `pnpm dev`      | Start Vite dev server on `http://localhost:5173` |
| `pnpm build`    | Production build to `dist/`                      |
| `pnpm preview`  | Serve production build locally                   |
| `pnpm lint`     | Run ESLint                                       |
| `pnpm lint:fix` | Auto-fix ESLint issues                           |
| `pnpm test`     | Run Jest tests                                   |

## Design Patterns

### RTK Query Flow

RTK Query is the primary data-fetching and server-cache layer. The architecture follows a **base slice + endpoint injection** pattern.

```
shared/api/apiSlice.js            Base slice: createApi({ baseQuery: baseQueryWithReauth })
        │                          tagTypes: Profile, Portfolio, Holdings, Wallet, Transactions
        ▼
features/<mod>/api/<mod>Api.js    injectEndpoints({ endpoints: (build) => ({...}) })
        │                          • query: URL, method, body
        │                          • transformResponse → DTO function
        │                          • providesTags / invalidatesTags
        ▼
features/<mod>/dto/<mod>.dto.js   DTO transformers normalise server responses
        │                          using shared/dto/helpers.js (str, num, bool, arr)
        ▼
Component hooks                    useGetPortfolioHoldingsQuery(), useExecuteOrderMutation(), etc.
```

**Base query location:** `src/shared/api/apiSlice.js`

**Endpoint injection:** Each feature's `api/<mod>Api.js` calls `apiSlice.injectEndpoints(...)`. All are imported as side-effects in `app/store.js` to ensure registration before the store is created.

**Infinite Query:** The market assets list (`/market`) uses `builder.infiniteQuery` (RTK Query 2.x). The endpoint is named `listAssets` and generates `useListAssetsInfiniteQuery`. RTK natively manages the `pages[]` array and `fetchNextPage` trigger. All page accumulation and `IntersectionObserver` sentinel logic (ref-callback pattern — no `useEffect`) is encapsulated in `features/market/hooks/useInfiniteAssets.js`.

**DTO transforms:** `transformResponse` in each endpoint normalises raw server JSON using type-safe helpers (`str`, `num`, `bool`, `arr` from `shared/dto/helpers.js`).

**Cache tags:**

| Tag            | Provided By                                                     | Invalidated By                                  |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `Profile`      | `getProfile`                                                    | `updateProfile`, `uploadAvatar`, `removeAvatar` |
| `Portfolio`    | `getPortfolioSummary`                                           | —                                               |
| `Holdings`     | `getPortfolioHoldings`                                          | —                                               |
| `Wallet`       | `getWallet`, `listWalletTransactions`, `getWalletTransactions`  | `executeOrder`                                  |
| `Transactions` | `listTransactions`, `getTransactions`, `listWalletTransactions` | `executeOrder`                                  |

**401 refresh flow:**

1. Request returns 401
2. Acquire mutex (prevents parallel refresh races)
3. POST `/api/v1/auth/refresh` (cookie-based, no body)
4. Refresh succeeds → retry original request
5. Refresh fails → no action (getMe query will naturally be in error state)
6. Concurrent 401s wait on mutex, then retry automatically

**Auth state management (slice-free):**

Auth state is not managed by a Redux slice. Instead:

- `getMe` query is fired on app load via `AuthProvider` → RTK Query caches the result (or enters error state if 401)
- `authSelectors.js` derives `user`, `isAuthenticated`, `isLoading` from the `getMe` cache using `createSelector`
- `login` / `register` mutations use `onQueryStarted` + `upsertQueryData` to write the returned user directly into the `getMe` cache
- `logout` mutation uses `onQueryStarted` to set the `getMe` cache to `null` and invalidate all data tags (Profile, Portfolio, Holdings, Wallet, Transactions)
- `GlobalLoader` is a pure presentational component — it accepts `show` (boolean) and `label` (string) props. Callers own the loading condition. `RootLayout` passes the logout mutation's `isLoading` state; `GuestRoute` and `ProtectedRoute` pass auth-hydration loading state.

### SSE Flow

The `useMarketStream` hook maintains a single `EventSource` connection to `/api/v1/market/stream`. Mounted once in `RootLayout` — all pages receive live price updates without additional subscriptions.

```
EventSource (/api/v1/market/stream)
    │
    │  event: price_update
    │  data: { ticker, price, change, changePercent, up }
    │
    ▼
useMarketStream (features/market/hooks/useMarketStream.js)
    │
    ├── Public patches (always):
    │     • getStockQuote(ticker)     → StockDetail page price
    │     • getMutualQuote(ticker)    → MutualDetail page price
    │     • getTickerQuotes()         → Navbar ticker strip
    │     • getAssets(*)              → Market listing prices (legacy)
    │     • listAssets(*)             → Patches all pages in the infinite query cache
    │                                    (pages[].items) with live price, change, and
    │                                    changePercent (1D from previous day's close)
    │     • getMarketMovers(*)        → Patches price, change, changePercent in both
    │                                    gainers[] and losers[] (all cached limit variants)
    │
    └── Authenticated patches (when logged in):
          • getPortfolioHoldings()   → Recalculates currentValue, unrealisedPnL, portfolioWeight
          • getPortfolioSummary()    → Updates currentValue, totalPnL, totalPnLPercent
          • getTaxHarvesting(*)      → Delivery opps: recomputes unrealizedLoss/estimatedSaving,
                                       drops below-threshold rows, re-sorts by savings desc.
                                       Intraday opps: recomputes unrealizedIntradayLoss via
                                       back-calculated _avgEntryPrice (initialised on first tick).
          • getTaxSummary(*)         → harvestingCount synced from minLoss=0 harvesting cache
```

Uses `apiSlice.util.updateQueryData()` (Immer-based draft patches) to mutate cached data in-place. Portfolio derived values (unrealised P&L, portfolio weight) are recomputed on every tick. Realised gains (`getTaxGains`) are deliberately not patched — they derive from historical SELL transactions and never move with live prices. Auto-reconnects via native `EventSource` reconnection on error.

### Order Form

`features/market/components/OrderForm.jsx` hosts the BUY/SELL tabs and renders `BuyForm` / `SellForm`. Both forms render an asset-type-aware input:

- **STOCK** — label "Quantity". Integer-only input (`step="1"`, `min="1"`, `inputMode="numeric"`). Decimal-producing keys (`.`, `,`, `e`, `E`, `+`, `-`) are blocked at keydown via `blockDecimalKeys` in `shared/utils/inputFilters.js`. Submit value is parsed with `parseInt`. Mirrors the server-side rule enforced by `transaction.service.executeOrder()`.
- **MUTUAL_FUND** — label "Units". Fractional input (`step="0.001"`, `min="0.001"`, `inputMode="decimal"`). Submit value is parsed with `parseFloat`. Matches the Indian MF industry convention where ownership is expressed in units allocated at NAV.

Throughout the app, Mutual Fund rows in tables (holdings, transactions, wallet history, tax gains, tax-loss harvesting) display a "units" suffix to distinguish from stock quantity.

### State Ownership

| Tier                  | Technology                | What Lives Here                                                 | Example                                             |
| --------------------- | ------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| **RTK Query cache**   | `apiSlice` managed cache  | All server data including auth: market, portfolio, wallet, user | `useGetMeQuery()`, `useGetPortfolioHoldingsQuery()` |
| **Derived selectors** | `createSelector`          | Auth state derived from `getMe` cache (user, isAuthenticated)   | `selectAuthState`, `selectIsAuthenticated`          |
| **Local component**   | `useState` / `useReducer` | Form inputs, UI toggles, pagination params, search text         | Order form quantity, chart range selector           |

**Rules:**

- Server data belongs in RTK Query cache — never copy into a Redux slice or local state
- No custom Redux slices exist — auth state is derived from the `getMe` query cache via selectors in `features/auth/store/authSelectors.js`
- Session hydration: `AuthProvider` fires `useGetMeQuery()` on mount; a 401 response (unauthenticated) leaves the query in error state, and selectors derive `isAuthenticated: false`
- Derived values (P&L, weight) are computed in `transformResponse` or SSE patch callbacks
- UI-only state (modal, tab, form draft) stays in local component state

### Feature Creation Guide

To add a new feature module:

1. Create directory structure: `src/features/<name>/api/`, `components/`, `dto/`, `routes/`, `index.js`
2. Create API slice: `api/<name>Api.js` — call `apiSlice.injectEndpoints({ endpoints: (build) => ({...}) })`
3. Add DTO transformer: `dto/<name>.dto.js` — normalise server responses using `shared/dto/helpers.js`
4. Create page component: `routes/<PageName>.jsx`
5. Register the route in `app/router.jsx` with the correct path and auth wrapper
6. Import the API slice as a side-effect in `app/store.js`: `import '@/features/<name>/api/<name>Api'`
7. Export public API from `index.js` barrel file

## Design System

All primitives live in `src/shared/ui/` and are exported from `shared/ui/index.js`. Import from the barrel: `import { Button, Badge } from '@/shared/ui'`.

| Component         | Description                                                                                    | When to Use                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Button`          | Multi-variant button with loading state (primary, secondary, danger, outline, ghost; sm/md/lg) | Any clickable action — form submit, navigation trigger, destructive action             |
| `Input`           | Styled text input with focus ring and placeholder styling                                      | Form fields, search boxes, text entry                                                  |
| `Label`           | Form field label with disabled state styling                                                   | Pair with `Input` in forms                                                             |
| `Badge`           | Coloured pill for status indicators (success, danger, warning, info)                           | Tags, status labels, category chips                                                    |
| `Alert`           | Dismissible alert banner with variant colours                                                  | Success/error/warning messages, notifications                                          |
| `Avatar`          | Radix-based image avatar with fallback initials                                                | User profile images, comment avatars                                                   |
| `Spinner`         | Animated loading indicator with optional label                                                 | Inline loading states, async operations in progress                                    |
| `Skeleton`        | Animated shimmer placeholder (accepts `className` for size/shape)                              | Content loading states where layout should be preserved — auth-gated UI, data fetching |
| `GlobalLoader`    | Full-screen branded overlay with pulsing icon and label (props: `show`, `label`)               | Route-guard auth resolution, logout transition, any full-viewport wait                 |
| `Progress`        | Radix-based progress bar                                                                       | Upload progress, completion indicators                                                 |
| `LineChart`       | Recharts area chart wrapper with theme-aware colours and optional baseline reference line      | Price history charts, trend visualisations                                             |
| `DataTable`       | Client-side paginated, sortable, searchable data table (TanStack)                              | Displaying in-memory datasets with filtering                                           |
| `ServerDataTable` | Server-side paginated data table with debounced search                                         | Large datasets fetched page-by-page from API                                           |
| `Pagination`      | Unified pagination bar supporting both client and server modes                                 | Used internally by DataTable and ServerDataTable                                       |
| `PageTitle`       | `<h1>` with standard heading styles                                                            | Page-level titles                                                                      |
| `PageDescription` | Muted paragraph text                                                                           | Subtitle/description below page titles                                                 |
| `SectionTitle`    | `<h2>` with section heading styles                                                             | Section headings within a page                                                         |
| `MutedText`       | Small muted text element                                                                       | Captions, helper text, timestamps                                                      |
| `StatValue`       | Large bold number with tone colouring (primary, success, danger)                               | Dashboard stat cards, KPI displays                                                     |

## Tax Center Feature

> **Educational only** — Simulated Indian capital gains tracking and tax-loss harvesting insights. Does not constitute tax advice.

### Pages

| Route             | Component       | Description                                                                             |
| ----------------- | --------------- | --------------------------------------------------------------------------------------- |
| `/tax`            | `TaxCenter`     | FY summary (STCG/LTCG/Intraday/Est. Tax), realized gains ledger, harvesting preview     |
| `/tax/harvesting` | `TaxHarvesting` | Full harvesting insights: 3 tabs (STCG, LTCG, Intraday), chart, sector heatmap, what-if |

### Key Components

| Component                    | Location                   | Purpose                                                               |
| ---------------------------- | -------------------------- | --------------------------------------------------------------------- |
| `TaxSummaryCard`             | `features/tax/components/` | STCG/LTCG/Intraday/Est. Tax stat cards; tax computed client-side      |
| `GainsTable`                 | `features/tax/components/` | Paginated realized gains ledger with asset-type and gain-type filters |
| `HarvestingMetrics`          | `features/tax/components/` | Per-bucket (STCG or LTCG) metric cards + insight card                 |
| `SectorHeatmap`              | `features/tax/components/` | Grid heatmap of delivery loss intensity by sector                     |
| `GainsVsLossesChart`         | `features/tax/components/` | Recharts waterfall bar chart: gains vs harvestable losses vs net      |
| `EnhancedOpportunitiesTable` | `features/tax/components/` | Sortable/filterable delivery opportunities table with row checkboxes  |
| `IntradayHarvestingSection`  | `features/tax/components/` | Tab 3: today's open intraday positions + intraday what-if panel       |
| `SlabRateConfig`             | `features/tax/components/` | Settings popover for income slab rate (5%/10%/20%/30%), localStorage  |
| `ThresholdConfig`            | `features/tax/components/` | Settings popover for minLoss threshold (₹0–₹10,000), localStorage     |
| `WhatIfPanel`                | `features/tax/components/` | Before/after tax panel for delivery (STCG or LTCG) selections         |
| `IntradayWhatIfPanel`        | `features/tax/components/` | Before/after tax panel for intraday selections (uses slab rate)       |

### Hooks

| Hook                   | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `useTaxYear`           | Indian FY selection state (default: current FY)                                  |
| `useThreshold`         | `useSyncExternalStore` module-store; minLoss threshold persisted to localStorage |
| `useSlabRate`          | `useSyncExternalStore` module-store; income slab rate persisted to localStorage  |
| `useWhatIfSimulator`   | Checkbox selection + per-bucket (STCG/LTCG) tax before/after computation         |
| `useIntradaySimulator` | Checkbox selection + intraday tax before/after computation                       |

### API Layer

RTK Query endpoints in `features/tax/api/taxApi.js`:

- `useGetTaxSummaryQuery({ taxYear })` — FY summary: totalSTCG, totalLTCG, totalIntraday, stcgTax, ltcgTax, estimatedTax, harvestingCount
- `useGetTaxGainsQuery({ taxYear, page, limit })` — paginated realized gain records
- `useGetTaxHarvestingQuery({ taxYear, minLoss })` — delivery opportunities + intradayOpportunities in one response

Both `getTaxSummary` and `getTaxHarvesting` use `keepUnusedDataFor: 0` to always refetch fresh data on mount.

### Intraday Tax (Section 43(5))

Intraday equity income is speculative business income taxed at the user's income slab rate — not a flat capital gains rate. The backend sends `totalIntraday` and `intradayOpportunities`; the client applies the user's chosen slab rate:

- `TaxSummaryCard` shows `Intraday (Slab X%)` and recomputes the full estimated tax client-side using `computeIntradayTax(totalIntraday, slabRate)`
- `SlabRateConfig` lets the user choose their slab (5%/10%/20%/30%); default 30% (conservative worst-case)
- `IntradayHarvestingSection` shows today's open positions closeable for a speculative loss; `useIntradaySimulator` computes before/after intraday tax on selection

### Live Price Updates

`useMarketStream` patches every cached `getTaxHarvesting` entry on each SSE tick:

- **Delivery opportunities** — recomputes `currentPrice`, `unrealizedLoss`, `estimatedSaving`; drops rows that fall at or below `minLoss`; re-sorts by `estimatedSaving` desc
- **Intraday opportunities** — recomputes `unrealizedIntradayLoss` using a `_avgEntryPrice` back-calculated and stored on first tick; re-sorts by loss desc
- `getTaxSummary.harvestingCount` is kept in sync from the `minLoss=0` harvesting cache entry

All tax UI components (`HarvestingMetrics`, `EnhancedOpportunitiesTable`, `SectorHeatmap`, `GainsVsLossesChart`, `WhatIfPanel`, `IntradayHarvestingSection`, `HarvestingPreview`) re-render automatically on each patch.

### Utils

Feature-specific utilities in `features/tax/utils/`:

| File                 | Contents                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `taxCalculations.js` | Rate constants (`STCG_RATE`, `LTCG_RATE`, `LTCG_EXEMPTION`), `computeTax()`, `computeIntradayTax()`, `computeHarvestingMetrics()`, `computeLossPercent()` |
| `taxFormatters.js`   | `getCurrentFY()`, `formatFYLabel()`, `generateFYOptions()`, `groupBySector()`, `getLossIntensity()`                                                       |
| `chartHelpers.js`    | `buildGainsVsLossesData()` — builds Recharts data array from summary + opportunities                                                                      |
