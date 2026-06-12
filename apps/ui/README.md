# BigBull UI — Frontend

React 19 + Vite SPA for the BigBull simulated Indian stock market platform.

## Stack

- **React 19** + **Vite**
- **Redux Toolkit** (RTK Query for all server state)
- **React Hook Form** for all forms
- **Tailwind CSS** + **Radix UI** primitives (shadcn-style)
- **React Router v6** with nested protected layouts

## Structure

```
apps/ui/src/
├── api/
│   ├── apiSlice.js      # RTK Query base slice — all endpoints, credentials: include
│   └── authApi.js       # Auth-specific RTK Query endpoints (getMe, loginV1, etc.)
├── components/
│   ├── auth/            # LoginForm, RegisterForm (React Hook Form, no useState)
│   ├── market/          # MarketContent, StockDetailContent, MutualDetailContent,
│   │                    #   OrderForm, NavbarSearch, MarketQuoteCard
│   ├── holdings/        # HoldingsContent — transaction-derived portfolio table
│   ├── dashboard/       # DashboardContent — portfolio stats cards
│   ├── layout/          # Navbar (with NavLinks), RootLayout, AuthLayout, etc.
│   ├── profile/         # ProfileContent, ProfileEditForm (RHF + values option)
│   ├── chat/            # FloatingChatbot — BigBull AI copilot
│   └── ui/              # Primitive components (Button, Card, Alert, Badge, etc.)
├── routes/
│   ├── router.jsx       # Route config
│   ├── app/             # ProtectedRoute (waits for auth hydration), RootRedirect
│   ├── auth/            # Login, Register, GuestRoute
│   ├── market/          # Market, StockDetail, MutualDetail
│   ├── holdings/        # Holdings (Portfolio page)
│   ├── dashboard/       # Dashboard
│   └── profile/         # Profile
├── store/
│   └── slices/authSlice.js  # Cookie-based — no localStorage tokens
├── hooks/
│   ├── useAuth.js       # login/register/logout via v1 RTK Query mutations
│   ├── useMarketSearch.js   # Debounced catalog search
│   ├── useChat.js       # Chat panel state
│   └── useThemeMode.js  # Light/dark toggle
├── constants/
│   ├── routes.js        # Route paths including /market
│   ├── apiUrls.js       # Full path constants for all endpoints
│   └── market.js        # Asset types, search config, path builders
└── App.jsx              # useGetMeQuery for auth hydration (no useEffect)
```

## Prerequisites

- **Node.js 18+**
- `apps/api` running on `http://localhost:4000`

## Setup

```bash
cd apps/ui
pnpm install    # or: npm install
```

No `.env` changes needed for local development — Vite proxies `/api` to `http://localhost:4000`.

## Run

```bash
npm run dev
# App: http://localhost:5173
```

## Key Patterns

**Auth** — HTTP-Only cookie based. `useGetMeQuery` in `App.jsx` hydrates Redux on load. No token in `localStorage`. `ProtectedRoute` shows a spinner while `isLoading` is true.

**Forms** — All forms use React Hook Form. No `useState` for form fields anywhere.

**Server state** — RTK Query only. No `useEffect` to sync server data into local state. `ProfileContent` uses RHF's `values` option to sync form with server data automatically.

**Market data** — All search, quotes, and prices come from the internal Asset catalog (seeded Indian stocks). No Alpha Vantage or external API.

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Redirects to `/dashboard` or `/explore` | — |
| `/login` | Login form | Guest only |
| `/register` | Register form | Guest only |
| `/dashboard` | Portfolio stats + AI chat | ✅ |
| `/market` | Browsable asset catalog | ✅ |
| `/market/stocks/:symbol` | Stock detail + BUY/SELL order form | ✅ |
| `/market/mutuals/:schemeCode` | MF detail + BUY/SELL order form | ✅ |
| `/holdings` | Transaction-derived portfolio table | ✅ |
| `/profile` | View/edit profile + avatar | ✅ |
| `/explore` | Public landing page with ticker strip | — |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (http://localhost:5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
