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
| async-mutex              | Token refresh race-condition guard                                                         |

## Architecture

```
apps/ui/
├── public/                     # Static assets served at root URL (favicon, brand icon, OG preview image)
├── src/
│   ├── app/                    # App-level wiring
│   │   ├── store.js            # Redux store (apiSlice reducer + middleware only)
│   │   ├── router.jsx          # createBrowserRouter route definitions
│   │   └── routes/NotFound.jsx # 404 page
│   ├── features/               # Feature modules (domain-sliced)
│   │   ├── auth/               # Login, register, session, route guards
│   │   ├── market/             # Asset listing (infinite scroll), quotes, SSE stream, search, top movers
│   │   ├── portfolio/          # Holdings, dashboard summary, P&L, Top Gainers/Losers (from market)
│   │   ├── tax/                # Capital gains, tax-loss harvesting
│   │   ├── transaction/        # Buy/sell order execution
│   │   ├── wallet/             # Balance display, wallet transaction history
│   │   ├── chat/               # AI copilot (Gemini)
│   │   ├── explore/            # Asset discovery landing page
│   │   └── user/               # Profile management, avatar
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── api/apiSlice.js     # RTK Query base slice + reauth wrapper
│   │   ├── components/         # Composite components (table, tabs, sheet, select, card, popover, calendar, date-range-picker)
│   │   ├── constants/          # Routes, API URLs, asset types, validation rules
│   │   ├── dto/helpers.js      # DTO primitives (str, num, bool, arr)
│   │   ├── errors/             # Error boundary, NotFoundCard
│   │   ├── hooks/              # useDebounce, useThemeMode
│   │   ├── layout/             # RootLayout, Navbar, GlobalLoader, PageShell, PageHeader
│   │   ├── ui/                 # Design system primitives (see below)
│   │   └── utils/              # Formatters, localStorage, market/portfolio helpers, input filters
│   ├── lib/utils.js            # Tailwind cn() merge utility
│   ├── theme/                  # Theme constants + utilities
│   ├── App.jsx                 # Provider composition root
│   └── main.jsx                # Vite entry point
└── index.html                  # Entry HTML (meta tags, favicon, font preloads)
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
| `*`                           | app       | Any        | `NotFound`      |

**Route guards:**

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
    │
    └── Authenticated patches (when logged in):
          • getPortfolioHoldings()   → Recalculates currentValue, unrealisedPnL, portfolioWeight
          • getPortfolioSummary()    → Updates currentValue, totalPnL, totalPnLPercent
          • getTaxHarvesting(*)      → Recomputes unrealizedLoss/estimatedSaving per opportunity,
                                       drops below-threshold rows, re-sorts by savings desc
```

Uses `apiSlice.util.updateQueryData()` (Immer-based draft patches) to mutate cached data in-place. Portfolio derived values (unrealised P&L, portfolio weight) are recomputed on every tick. Tax harvesting opportunities recompute `currentPrice`, `unrealizedLoss`, and `estimatedSaving` per matching ticker, then drop entries that fell at or below the active `minLoss` threshold and re-sort by savings desc — mirroring the backend filter and ordering. Realised gains (`getTaxGains`, `getTaxSummary`) are deliberately not patched because their values come from historical SELL transactions. Auto-reconnects via native `EventSource` reconnection on error.

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

| Component         | Description                                                                                    | When to Use                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Button`          | Multi-variant button with loading state (primary, secondary, danger, outline, ghost; sm/md/lg) | Any clickable action — form submit, navigation trigger, destructive action |
| `Input`           | Styled text input with focus ring and placeholder styling                                      | Form fields, search boxes, text entry                                      |
| `Label`           | Form field label with disabled state styling                                                   | Pair with `Input` in forms                                                 |
| `Badge`           | Coloured pill for status indicators (success, danger, warning, info)                           | Tags, status labels, category chips                                        |
| `Alert`           | Dismissible alert banner with variant colours                                                  | Success/error/warning messages, notifications                              |
| `Avatar`          | Radix-based image avatar with fallback initials                                                | User profile images, comment avatars                                       |
| `Spinner`         | Animated loading indicator with optional label                                                 | Inline loading states, async operations in progress                        |
| `GlobalLoader`    | Full-screen branded overlay with pulsing icon and label (props: `show`, `label`)               | Route-guard auth resolution, logout transition, any full-viewport wait     |
| `Progress`        | Radix-based progress bar                                                                       | Upload progress, completion indicators                                     |
| `LineChart`       | Recharts area chart wrapper with theme-aware colours and optional baseline reference line      | Price history charts, trend visualisations                                 |
| `DataTable`       | Client-side paginated, sortable, searchable data table (TanStack)                              | Displaying in-memory datasets with filtering                               |
| `ServerDataTable` | Server-side paginated data table with debounced search                                         | Large datasets fetched page-by-page from API                               |
| `Pagination`      | Unified pagination bar supporting both client and server modes                                 | Used internally by DataTable and ServerDataTable                           |
| `PageTitle`       | `<h1>` with standard heading styles                                                            | Page-level titles                                                          |
| `PageDescription` | Muted paragraph text                                                                           | Subtitle/description below page titles                                     |
| `SectionTitle`    | `<h2>` with section heading styles                                                             | Section headings within a page                                             |
| `MutedText`       | Small muted text element                                                                       | Captions, helper text, timestamps                                          |
| `StatValue`       | Large bold number with tone colouring (primary, success, danger)                               | Dashboard stat cards, KPI displays                                         |

## Tax Center Feature

> **Educational only** — This feature provides simulated Indian capital gains tracking and tax-loss harvesting insights. It does not constitute tax advice.

### Pages

| Route             | Component       | Description                                                         |
| ----------------- | --------------- | ------------------------------------------------------------------- |
| `/tax`            | `TaxCenter`     | FY capital gains summary, realized gains ledger, harvesting preview |
| `/tax/harvesting` | `TaxHarvesting` | Full harvesting insights with metrics, charts, What-If simulator    |

### Key Components

| Component                    | Location                   | Purpose                                             |
| ---------------------------- | -------------------------- | --------------------------------------------------- |
| `TaxSummaryCard`             | `features/tax/components/` | STCG/LTCG/tax totals display                        |
| `GainsTable`                 | `features/tax/components/` | Paginated realized gains ledger with filters        |
| `HarvestingMetrics`          | `features/tax/components/` | Metric cards (total loss, savings, offsets)         |
| `SectorHeatmap`              | `features/tax/components/` | Grid heatmap of losses by sector                    |
| `GainsVsLossesChart`         | `features/tax/components/` | Recharts bar chart of gains vs losses               |
| `EnhancedOpportunitiesTable` | `features/tax/components/` | Sortable/filterable table with selection checkboxes |
| `WhatIfPanel`                | `features/tax/components/` | Sticky bottom panel showing simulated tax savings   |

### Hooks

| Hook                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `useTaxYear`         | Indian FY selection state (default: current FY)      |
| `useThreshold`       | localStorage-persisted minLoss threshold             |
| `useWhatIfSimulator` | Multi-select state + savings computation for What-If |

### API Layer

RTK Query endpoints in `features/tax/api/taxApi.js`:

- `useGetTaxSummaryQuery({ taxYear })` — FY tax summary with estimated tax
- `useGetTaxGainsQuery({ taxYear, page, limit })` — paginated realized gains
- `useGetTaxHarvestingQuery({ taxYear, minLoss })` — harvesting opportunities

### Live Price Updates

The harvesting screen (and the harvesting preview on `/tax`) updates in real time as the SSE market stream broadcasts `price_update` events. `useMarketStream` patches every cached `getTaxHarvesting` entry — recomputing `currentPrice`, `unrealizedLoss`, and `estimatedSaving` per matched ticker, dropping rows that fell at or below the active `minLoss` threshold, and re-sorting by savings desc. All consumers (`HarvestingMetrics`, `EnhancedOpportunitiesTable`, `SectorHeatmap`, `GainsVsLossesChart`, `WhatIfPanel`, `HarvestingPreview`) re-render automatically. Realized gains (`getTaxGains`, `getTaxSummary`) are deliberately not patched because they are historical.

### Utils

Feature-specific utilities in `features/tax/utils/`:

| File                 | Contents                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `taxCalculations.js` | Tax rate constants, `computeTax()`, `computeHarvestingMetrics()`, `computeLossPercent()`            |
| `taxFormatters.js`   | `getCurrentFY()`, `formatFYLabel()`, `generateFYOptions()`, `groupBySector()`, `getLossIntensity()` |
| `chartHelpers.js`    | `buildGainsVsLossesData()` for Recharts bar chart                                                   |

### Navigation

Users reach the Tax Center through:

- **Desktop** — Profile dropdown menu (UserMenu) → "Tax Center"
- **Mobile** — Hamburger drawer → "Tax Center"
- **Dashboard** — Quick-access cards linking to both `/tax` and `/tax/harvesting`
- **Portfolio/Holdings** — "Tax Center" button in page header
- **Tax Center page** — "Harvesting Opportunities" stat card links to `/tax/harvesting`; `HarvestingPreview` table has "View All Insights →" link
