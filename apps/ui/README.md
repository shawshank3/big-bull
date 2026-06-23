# BigBull UI

> React single-page application for BigBull — a virtual stock market simulation platform. Feature-module architecture with RTK Query data fetching, SSE real-time price updates, and cookie-based authentication.

## Stack

| Technology               | Role                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| React 19                 | UI library                                                                        |
| Redux Toolkit            | Global state management (auth slice)                                              |
| RTK Query                | Server data fetching, caching, and mutations                                      |
| React Router 6           | Client-side routing (`createBrowserRouter`)                                       |
| Vite 5                   | Build tool and dev server                                                         |
| Tailwind CSS 3           | Utility-first styling                                                             |
| Radix UI                 | Accessible headless primitives (Avatar, Dialog, Select, Tabs, Progress, Dropdown) |
| class-variance-authority | Component variant definitions                                                     |
| React Hook Form          | Form state management                                                             |
| Recharts                 | Chart visualisations                                                              |
| @tanstack/react-table    | Data table rendering (client + server paginated)                                  |
| Lucide React             | Icon library                                                                      |
| async-mutex              | Token refresh race-condition guard                                                |

## Architecture

```
apps/ui/src/
├── app/                        # App-level wiring
│   ├── store.js                # Redux store (auth reducer + apiSlice middleware)
│   ├── router.jsx              # createBrowserRouter route definitions
│   └── routes/NotFound.jsx     # 404 page
├── features/                   # Feature modules (domain-sliced)
│   ├── auth/                   # Login, register, session, route guards
│   ├── market/                 # Asset listing, quotes, SSE stream, search
│   ├── portfolio/              # Holdings, dashboard summary, P&L
│   ├── transaction/            # Buy/sell order execution
│   ├── wallet/                 # Balance display, wallet transaction history
│   ├── chat/                   # AI copilot (Gemini)
│   ├── explore/                # Asset discovery landing page
│   └── user/                   # Profile management, avatar
├── shared/                     # Cross-cutting concerns
│   ├── api/apiSlice.js         # RTK Query base slice + reauth wrapper
│   ├── components/             # Composite components (table, tabs, sheet, select, card)
│   ├── constants/              # Routes, API URLs, asset types, validation rules
│   ├── dto/helpers.js          # DTO primitives (str, num, bool, arr)
│   ├── errors/                 # Error boundary, NotFoundCard
│   ├── hooks/                  # useDebounce, useThemeMode
│   ├── layout/                 # RootLayout, Navbar, PageShell, PageHeader
│   ├── ui/                     # Design system primitives (see below)
│   └── utils/                  # Formatters, localStorage, market/portfolio helpers
├── lib/utils.js                # Tailwind cn() merge utility
├── theme/                      # Theme constants + utilities
├── App.jsx                     # Provider composition root
└── main.jsx                    # Vite entry point
```

**Backend module mapping:** Each frontend feature module maps to a corresponding backend API module — `auth → /api/v1/auth`, `market → /api/v1/market`, `portfolio → /api/v1/portfolio`, `transaction → /api/v1/transactions`, `wallet → /api/v1/wallet`, `chat → /api/v1/chat`, `user → /api/v1/users`.

### Feature Module Internal Structure

```
features/<module>/
├── api/<module>Api.js       # RTK Query injectEndpoints
├── dto/<module>.dto.js      # Response → DTO transformers
├── components/              # UI components (private to module)
├── hooks/                   # Custom hooks (private unless exported via index.js)
├── routes/                  # Page-level components mounted by router
├── store/                   # Redux slice (only auth has one)
├── constants/               # Module-specific constants
├── utils/                   # Module-specific helpers
└── index.js                 # Public barrel — only this is importable externally
```

**Rules:**

- Cross-feature imports use the barrel (`index.js`) only — never reach into another module's internals
- Each module owns its own API endpoints, DTOs, and components
- Only `auth` has a Redux slice; all other server data lives in RTK Query cache

## Pages

| Route                         | Feature   | Auth       | Component      |
| ----------------------------- | --------- | ---------- | -------------- |
| `/`                           | auth      | Any        | `RootRedirect` |
| `/login`                      | auth      | Guest only | `Login`        |
| `/register`                   | auth      | Guest only | `Register`     |
| `/dashboard`                  | portfolio | Protected  | `Dashboard`    |
| `/holdings`                   | portfolio | Protected  | `Holdings`     |
| `/profile`                    | user      | Protected  | `Profile`      |
| `/wallet`                     | wallet    | Protected  | `Wallet`       |
| `/market`                     | market    | Public     | `Market`       |
| `/market/stocks/:symbol`      | market    | Public     | `StockDetail`  |
| `/market/mutuals/:schemeCode` | market    | Public     | `MutualDetail` |
| `/search`                     | market    | Public     | `Search`       |
| `/explore`                    | explore   | Public     | `Explore`      |
| `*`                           | app       | Any        | `NotFound`     |

**Route guards:**

- `GuestRoute` — wraps login/register; redirects to `/dashboard` if already authenticated
- `ProtectedRoute` — wraps dashboard/holdings/profile/wallet; redirects to `/login` if unauthenticated

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
4. Refresh succeeds → dispatch `tokenRefreshed()`, retry original request
5. Refresh fails → dispatch `clearUser()` (forces logout)
6. Concurrent 401s wait on mutex, then retry automatically

**Auth state reset:** A `listenerMiddleware` listens for `clearUser`, `logout`, `loginSuccess`, `registerSuccess` — on any of these it dispatches `apiSlice.util.resetApiState()` to clear all cached data.

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
    │     • getAssets(*)              → Market listing prices
    │     • listAssets(*)             → Paginated market listing prices
    │
    └── Authenticated patches (when logged in):
          • getPortfolioHoldings()   → Recalculates currentValue, unrealisedPnL, portfolioWeight
          • getPortfolioSummary()    → Updates currentValue, totalPnL, totalPnLPercent
```

Uses `apiSlice.util.updateQueryData()` (Immer-based draft patches) to mutate cached data in-place. Portfolio derived values (unrealised P&L, portfolio weight) are recomputed on every tick. Auto-reconnects via native `EventSource` reconnection on error.

### State Ownership

| Tier                   | Technology                | What Lives Here                                                   | Example                                       |
| ---------------------- | ------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| **Global Redux slice** | `@reduxjs/toolkit` slice  | Auth session (user, isAuthenticated, isLoading)                   | `features/auth/store/authSlice.js`            |
| **RTK Query cache**    | `apiSlice` managed cache  | All server data: market, portfolio, wallet, transactions, profile | `useGetPortfolioHoldingsQuery()` return value |
| **Local component**    | `useState` / `useReducer` | Form inputs, UI toggles, pagination params, search text           | Order form quantity, chart range selector     |

**Rules:**

- Server data belongs in RTK Query cache — never copy into a Redux slice or local state
- Auth is the only Redux slice; hydrated on app load via `useGetMeQuery` in `AuthProvider`
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

| Component           | Description                                                                                    | When to Use                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Button`            | Multi-variant button with loading state (primary, secondary, danger, outline, ghost; sm/md/lg) | Any clickable action — form submit, navigation trigger, destructive action |
| `Input`             | Styled text input with focus ring and placeholder styling                                      | Form fields, search boxes, text entry                                      |
| `Label`             | Form field label with disabled state styling                                                   | Pair with `Input` in forms                                                 |
| `Badge`             | Coloured pill for status indicators (success, danger, warning, info)                           | Tags, status labels, category chips                                        |
| `Alert`             | Dismissible alert banner with variant colours                                                  | Success/error/warning messages, notifications                              |
| `Avatar`            | Radix-based image avatar with fallback initials                                                | User profile images, comment avatars                                       |
| `Spinner`           | Animated loading indicator with optional label                                                 | Loading states, async operations in progress                               |
| `Progress`          | Radix-based progress bar                                                                       | Upload progress, completion indicators                                     |
| `LineChart`         | Recharts area chart wrapper with theme-aware colours                                           | Price history charts, trend visualisations                                 |
| `DataTable`         | Client-side paginated, sortable, searchable data table (TanStack)                              | Displaying in-memory datasets with filtering                               |
| `ServerDataTable`   | Server-side paginated data table with debounced search                                         | Large datasets fetched page-by-page from API                               |
| `Pagination`        | Unified pagination bar supporting both client and server modes                                 | Used internally by DataTable and ServerDataTable                           |
| `GrowingMarketIcon` | SVG candlestick chart icon                                                                     | Brand/logo usage, empty states                                             |
| `PageTitle`         | `<h1>` with standard heading styles                                                            | Page-level titles                                                          |
| `PageDescription`   | Muted paragraph text                                                                           | Subtitle/description below page titles                                     |
| `SectionTitle`      | `<h2>` with section heading styles                                                             | Section headings within a page                                             |
| `MutedText`         | Small muted text element                                                                       | Captions, helper text, timestamps                                          |
| `StatValue`         | Large bold number with tone colouring (primary, success, danger)                               | Dashboard stat cards, KPI displays                                         |
