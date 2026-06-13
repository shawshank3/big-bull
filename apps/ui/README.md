# BigBull UI — Frontend

React 19 + Vite 5 SPA for the BigBull simulated Indian stock market platform.

## Stack

| Layer | Library / Tool |
|---|---|
| Framework | React 19 + Vite 5 |
| Routing | React Router v6 (nested layouts, protected routes) |
| State | Redux Toolkit — `authSlice` for auth, RTK Query for all server state |
| Forms | React Hook Form (no `useState` for form fields) |
| Styling | Tailwind CSS v3 + Radix UI primitives |
| HTTP | RTK Query with `baseQueryWithReauth` mutex wrapper (auto token refresh on 401) |
| Testing | Jest (unit / property tests) |

---

## Project Structure

```
apps/ui/src/
├── api/
│   ├── apiSlice.js          # Base RTK Query slice — baseQueryWithReauth only, no endpoints
│   ├── authApi.js           # /api/v1/auth/* (login, register, logout, getMe, profile)
│   ├── marketApi.js         # /api/v1/market/* (assets, search, quotes, ticker)
│   ├── portfolioApi.js      # /api/v1/portfolio/* (holdings, summary)
│   ├── walletApi.js         # /api/v1/wallet
│   ├── transactionApi.js    # /api/v1/transactions/* (history, order)
│   └── chatApi.js           # /api/v1/chat (sendMessage)
├── components/
│   ├── auth/                # LoginForm, RegisterForm
│   ├── chat/                # FloatingChatbot — AI copilot panel
│   ├── common/              # Alert, Button, Input shared components
│   ├── dashboard/           # DashboardContent — portfolio stats cards
│   ├── holdings/            # HoldingsContent — transaction-derived portfolio table
│   ├── layout/              # Navbar, RootLayout, AuthLayout, UserMenu, PageHeader
│   ├── market/              # MarketContent, StockDetailContent, MutualDetailContent,
│   │                        #   OrderForm, MarketQuoteCard, NavbarSearch
│   ├── profile/             # ProfileContent, ProfileEditForm, PhotoUploadModal
│   └── ui/                  # Primitive components (Button, Card, Badge, Spinner, etc.)
├── constants/
│   ├── apiUrls.js           # All /api/v1/* URL strings (single source of truth)
│   ├── chat.js              # Chat welcome message, role constants
│   ├── market.js            # Asset type labels, search config, path builders
│   └── routes.js            # Route path constants
├── hooks/
│   ├── useAuth.js           # login / register / logout orchestration
│   ├── useChat.js           # Chat message state machine
│   ├── useDebounce.js       # Generic debounce hook
│   ├── useMarketSearch.js   # Debounced catalog search via RTK Query
│   └── useThemeMode.js      # Light / dark theme toggle
├── routes/
│   ├── router.jsx           # React Router v6 route tree
│   ├── app/                 # ProtectedRoute, RootRedirect
│   ├── auth/                # Login, Register, GuestRoute
│   ├── dashboard/           # Dashboard page
│   ├── explore/             # Public landing page + TickerStrip
│   ├── holdings/            # Holdings (portfolio) page
│   ├── market/              # Market, StockDetail, MutualDetail pages
│   ├── not-found/           # 404 page
│   └── profile/             # Profile page
├── store/
│   ├── slices/authSlice.js  # Auth state: user, isAuthenticated, isLoading, error
│   └── store.js             # Redux store — apiSlice + authReducer + listenerMiddleware
├── theme/                   # Tailwind theme constants and utilities
├── utils/                   # Pure formatting helpers (currency, dates, portfolio math)
├── App.jsx                  # Root — fires useGetMeQuery for app-load hydration
└── main.jsx                 # Vite entry point
```

---

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Redirects to `/dashboard` (auth) or `/explore` (guest) | — |
| `/explore` | Public landing page with live ticker strip | — |
| `/login` | Login form | Guest only |
| `/register` | Register form | Guest only |
| `/dashboard` | Portfolio stats + allocation chart + AI chat | ✅ |
| `/market` | Browsable asset catalog (stocks + mutual funds) | ✅ |
| `/market/stocks/:symbol` | Stock detail + live price + BUY/SELL order form | ✅ |
| `/market/mutuals/:schemeCode` | Mutual fund detail + BUY/SELL order form | ✅ |
| `/holdings` | Transaction-derived portfolio table with P&L | ✅ |
| `/profile` | View/edit profile, avatar upload/remove | ✅ |

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

No `.env` changes are needed for local development — Vite proxies all `/api` requests to `http://localhost:4000` automatically.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api` | API base URL (used in production builds only; dev uses Vite proxy) |
| `VITE_APP_NAME` | `BigBull` | Display name of the application |

Copy `.env.example` to `.env` to override:

```bash
cp .env.example .env
```

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
- `App.jsx` calls `useGetMeQuery` on mount to hydrate Redux auth state. No `useEffect` for auth.
- `ProtectedRoute` shows a loading spinner while `isLoading` is true (during hydration).
- On 401, `baseQueryWithReauth` in `apiSlice.js` calls `POST /api/v1/auth/refresh` transparently using a mutex so only one refresh is ever in flight at a time.

### RTK Query (server state)
- All server state is managed by RTK Query. No `useEffect` to sync API responses into local state.
- Endpoints are split into domain files (`authApi`, `marketApi`, etc.) — each injects into the shared base `apiSlice` via `injectEndpoints`. Import hooks from the domain file, not from `apiSlice`.
- Cache invalidation is tag-based: executing an order invalidates `Portfolio`, `Holdings`, `Wallet`, and `Transactions`.

### Forms
- All forms use **React Hook Form**. No `useState` for individual field values.
- `ProfileEditForm` uses RHF's `values` option to automatically sync form state with server data — no manual reset needed.

### Market data
- All asset data (search, quotes, prices) comes from the seeded internal catalog on the API. No external market API is called from the frontend.
- The ticker strip polls `GET /api/v1/market/ticker` every 5 minutes.
- Stock/MF detail pages poll their quote endpoint every 30 seconds.
