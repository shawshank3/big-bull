# BigBull UI — Frontend

React 19 + Vite 5 SPA for the BigBull simulated Indian stock market platform.

## Stack

| Layer     | Library / Tool                                                                 |
| --------- | ------------------------------------------------------------------------------ |
| Framework | React 19 + Vite 5                                                              |
| Routing   | React Router v6 (nested layouts, protected routes)                             |
| State     | Redux Toolkit — `authSlice` for auth, RTK Query for all server state           |
| Forms     | React Hook Form (no `useState` for form fields)                                |
| Styling   | Tailwind CSS v3 + Radix UI primitives                                          |
| Charts    | Recharts — wrapped behind `shared/ui/line-chart.jsx`                           |
| HTTP      | RTK Query with `baseQueryWithReauth` mutex wrapper (auto token refresh on 401) |
| Testing   | Jest (unit / property tests)                                                   |

---

## Architecture — Feature-Module Structure

The frontend mirrors the backend's vertical module structure. Every feature owns its API layer, DTOs, components, hooks, routes, and state. Shared infrastructure lives in `shared/`.

```
apps/ui/src/
├── app/
│   ├── router.jsx           # React Router v6 route tree — imports from feature modules
│   ├── store.js             # Redux store — authReducer + apiSlice + listenerMiddleware
│   └── routes/
│       └── NotFound.jsx     # 404 page
│
├── features/
│   ├── auth/                ↔ backend auth module
│   │   ├── api/authApi.js
│   │   ├── dto/auth.dto.js
│   │   ├── store/authSlice.js
│   │   ├── hooks/useAuth.js
│   │   ├── providers/AuthProvider.jsx
│   │   ├── layout/AuthLayout.jsx
│   │   └── routes/ + components/
│   │
│   ├── user/                ↔ backend user module
│   │   ├── api/userApi.js
│   │   ├── dto/user.dto.js
│   │   └── routes/ + components/
│   │
│   ├── market/              ↔ backend market module
│   │   ├── api/marketApi.js       # getAssets, getAssetByTicker, searchMarket,
│   │   │                          #   getStockQuote, getMutualQuote, getTickerQuotes,
│   │   │                          #   getChart (useGetChartQuery)
│   │   ├── dto/market.dto.js      # toAssetDTO, toQuoteDTO, toTickerDTO,
│   │   │                          #   toSearchResultDTO, toChartDTO
│   │   ├── constants/market.js
│   │   ├── hooks/
│   │   │   ├── useMarketSearch.js
│   │   │   └── useMarketStream.js # SSE hook — patches RTK Query cache on price_update
│   │   ├── routes/
│   │   │   ├── Market.jsx
│   │   │   ├── StockDetail.jsx
│   │   │   └── MutualDetail.jsx
│   │   └── components/
│   │       ├── MarketContent.jsx
│   │       ├── MarketQuoteCard.jsx   # compound component for price display
│   │       ├── StockDetailContent.jsx  # quote card + PriceChart + OrderForm
│   │       ├── MutualDetailContent.jsx # quote card + PriceChart + OrderForm
│   │       ├── PriceChart.jsx          # chart card with range tabs + LineChart
│   │       ├── NavbarSearch.jsx
│   │       └── OrderForm.jsx
│   │
│   ├── portfolio/           ↔ backend portfolio module
│   ├── transaction/         ↔ backend transaction module
│   ├── wallet/              ↔ backend wallet module
│   ├── chat/                ↔ backend chat module
│   └── explore/             # Public landing page
│
├── shared/
│   ├── api/apiSlice.js      # Base RTK Query slice — baseQueryWithReauth (401 → refresh → retry)
│   ├── dto/helpers.js       # str, num, bool, arr safe-default coercion helpers
│   ├── constants/           # ROUTES, API_URLS
│   ├── hooks/               # useDebounce, useThemeMode
│   ├── layout/              # RootLayout, Navbar, AppPageLayout, PageHeader …
│   ├── errors/              # RouteErrorBoundary, NotFoundCard
│   └── ui/                  # Design-system primitives (Radix UI + Tailwind + Recharts)
│       ├── alert.jsx
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dropdown-menu.jsx
│       ├── FormInput.jsx
│       ├── FormTextarea.jsx
│       ├── GrowingMarketIcon.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── line-chart.jsx   # Recharts AreaChart wrapper — theme-aware, forwardRef
│       ├── progress.jsx
│       ├── sheet.jsx
│       ├── spinner.jsx
│       ├── table.jsx
│       ├── tabs.jsx
│       ├── typography.jsx
│       └── index.js         # Barrel export for all primitives incl. LineChart
│
├── theme/
├── lib/utils.js             # cn() — clsx + tailwind-merge
├── App.jsx
└── main.jsx
```

---

## Architectural Rules

- **Feature code lives inside its owning feature module.** Nothing from `features/auth` leaks into `features/market`, etc.
- **Features may import from `shared/`, but `shared/` never imports from `features/`.**
- **API definitions and DTOs belong to the owning feature.** Import RTK Query hooks from `features/<name>/api/<name>Api.js`.
- **`shared/ui/` is for stateless design-system primitives only.** Feature-specific business logic stays inside the feature.
- **`LineChart` is the only chart primitive** — `PriceChart` (a feature component) uses it; nothing else imports Recharts directly.

---

## Backend ↔ Frontend Module Mapping

| Backend Module | Frontend Feature       |
| -------------- | ---------------------- |
| `auth`         | `features/auth`        |
| `user`         | `features/user`        |
| `market`       | `features/market`      |
| `portfolio`    | `features/portfolio`   |
| `transaction`  | `features/transaction` |
| `wallet`       | `features/wallet`      |
| `chat`         | `features/chat`        |

---

## API / DTO Ownership

| Feature file                                 | Endpoints                                 | DTOs                                                                         |
| -------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `features/auth/api/authApi.js`               | `getMe`, `login`, `register`, `logout`    | `toAuthUserDTO`                                                              |
| `features/user/api/userApi.js`               | `getProfile`, `updateProfile`, avatar     | `toUserProfileDTO`                                                           |
| `features/market/api/marketApi.js`           | assets, search, quotes, ticker, **chart** | `toAssetDTO`, `toQuoteDTO`, `toTickerDTO`, `toSearchResultDTO`, `toChartDTO` |
| `features/portfolio/api/portfolioApi.js`     | holdings, summary                         | `toHoldingListDTO`, `toSummaryDTO`                                           |
| `features/transaction/api/transactionApi.js` | history (`?assetId` filter), executeOrder | `toTransactionHistoryDTO`, `toOrderResultDTO`                                |
| `features/wallet/api/walletApi.js`           | getWallet                                 | `toWalletDTO`                                                                |
| `features/chat/api/chatApi.js`               | sendChatMessage                           | `toChatReplyDTO`                                                             |

---

## Pages

| Route                         | Feature / Page                                                                    | Auth       |
| ----------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `/`                           | `auth/routes/RootRedirect` → `/dashboard` or `/explore`                           | —          |
| `/explore`                    | `explore/Explore` — public landing, live ticker strip                             | —          |
| `/login`                      | `auth/routes/Login`                                                               | Guest only |
| `/register`                   | `auth/routes/Register`                                                            | Guest only |
| `/dashboard`                  | `portfolio/routes/Dashboard` — stats + allocation + AI                            | ✅         |
| `/market`                     | `market/routes/Market` — browsable asset catalog                                  | ✅         |
| `/market/stocks/:symbol`      | `market/routes/StockDetail` — quote + **chart** + order + **transaction history** | ✅         |
| `/market/mutuals/:schemeCode` | `market/routes/MutualDetail` — NAV + **chart** + order + **transaction history**  | ✅         |
| `/holdings`                   | `portfolio/routes/Holdings` — full P&L table                                      | ✅         |
| `/profile`                    | `user/routes/Profile` — view/edit profile + avatar                                | ✅         |

---

## Historical Price Charts

Both `StockDetail` and `MutualDetail` pages include a `PriceChart` card below the quote card.

**`PriceChart`** (`features/market/components/PriceChart.jsx`):

- Range selector tabs: `1D | 1W | 1M | 3M | 1Y` for stocks; `1W | 1M | 3M | 1Y` for mutual funds (MFs have no intraday 1D data)
- Fetches from `GET /api/v1/market/chart/:ticker?range=…` via `useGetChartQuery`
- 1D range polls every 60s; longer ranges are static
- Shows a delta badge with ₹ change and % for the selected range
- Derives line colour from first vs last price: green (up), red (down), blue (neutral)
- Loading, error, and empty states all handled with contextual messages

**`LineChart`** (`shared/ui/line-chart.jsx`):

- Recharts `AreaChart` with gradient fill
- Fully theme-aware — all colours come from CSS variables (`--success`, `--danger`, `--primary`, `--border`, `--muted`)
- Follows the `forwardRef + cn() + CSS variable token` pattern of every other `shared/ui` component
- `granularity` prop switches the default x-axis formatter between `HH:MM` (intraday) and `DD MMM` (daily)

---

## Prerequisites

- **Node.js 18+**
- `apps/api` running on `http://localhost:4000`

---

## Setup

```bash
cd apps/ui
pnpm install    # or: npm install
```

No `.env` changes needed for local dev — Vite proxies all `/api` requests to `http://localhost:4000`.

---

## Environment Variables

| Variable        | Default                     | Description                                         |
| --------------- | --------------------------- | --------------------------------------------------- |
| `VITE_API_URL`  | `http://localhost:4000/api` | API base URL (production only; dev uses Vite proxy) |
| `VITE_APP_NAME` | `BigBull`                   | Display name of the application                     |

---

## Run

```bash
npm run dev       # Dev server → http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint
npm test          # Jest unit / property tests
```

---

## Key Design Patterns

### Authentication

- JWTs live in **HTTP-Only cookies** set by the server. The frontend never reads the raw token.
- `AuthProvider` calls `useGetMeQuery` on mount to hydrate Redux auth state.
- On 401, `baseQueryWithReauth` calls `POST /api/v1/auth/refresh` transparently using a mutex so only one refresh is ever in flight.
- **Logout flow:** `useAuth.logout()` dispatches `setLoggingOut(true)` before the API call. `RootLayout` renders `<GlobalLoader />` which reads `isLoggingOut` from Redux and shows a full-screen branded overlay. `clearUser()` resets the flag and the overlay disappears as the route transitions to `/login`.

### RTK Query (server state)

- All server state is RTK Query. No `useEffect` to sync API responses into local state.
- Each feature owns its RTK Query endpoints via `injectEndpoints` on the shared base `apiSlice`.
- Cache invalidation is tag-based: executing an order invalidates `Portfolio`, `Holdings`, `Wallet`, and `Transactions`.
- Cache is fully reset on auth state changes (login/logout) via a Redux `listenerMiddleware`.

### DTOs

- Every API response is transformed through a DTO function before entering the store. Raw server shapes never reach components.
- DTO helpers (`str`, `num`, `bool`, `arr`) guarantee safe defaults — components never guard against `undefined`.
- All DTO transformers are property-based tested in `shared/dto/transformers.test.js`.

### Forms

- All forms use **React Hook Form**. No `useState` for individual field values.

### Market data and live prices

- **`useMarketStream`** — mounted once in `RootLayout`. Opens an `EventSource` to `GET /api/v1/market/stream`. On each `price_update` SSE event it patches the RTK Query cache in-place — no re-fetch.

  | Cache patched              | Consumer                                                       |
  | -------------------------- | -------------------------------------------------------------- |
  | `getStockQuote(ticker)`    | `StockDetailContent`                                           |
  | `getMutualQuote(ticker)`   | `MutualDetailContent`                                          |
  | `getTickerQuotes`          | `TickerStrip`                                                  |
  | `getAssets` (all variants) | `MarketContent` price column                                   |
  | `getPortfolioHoldings`     | `HoldingsContent` — currentPrice, P&L, portfolioWeight         |
  | `getPortfolioSummary`      | Dashboard stat cards — currentValue, totalPnL, totalPnLPercent |

- **Stock prices** update every second via SSE. **Mutual fund NAVs** are fixed for the day.
- Polling intervals (60s for quotes/ticker) act as a fallback if the SSE connection drops.

### Order Form & Detail Pages

- **OrderForm** shows "In holdings" (live held quantity from `useGetPortfolioHoldingsQuery`) instead of current price. On successful BUY or SELL it navigates to `/holdings`.
- **AssetTransactionsTable** (`features/transaction/components/`) is rendered below the chart+order layout on both `StockDetailContent` and `MutualDetailContent`. It calls `GET /api/v1/transactions?assetId=<id>` — server-side filtered, full-width, shows "No transactions" when empty.
