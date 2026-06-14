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
│       └── NotFound.jsx     # 404 page (renders shared/errors/NotFoundCard)
│
├── features/
│   ├── auth/                ↔ backend auth module
│   │   ├── api/authApi.js         # getMe, login, register, logout
│   │   ├── dto/auth.dto.js        # toAuthUserDTO
│   │   ├── store/authSlice.js     # user, isAuthenticated, isLoading, error
│   │   ├── hooks/useAuth.js       # login / register / logout orchestration
│   │   ├── providers/AuthProvider.jsx  # AuthContext + getMe hydration on app load
│   │   ├── layout/AuthLayout.jsx  # Full-screen centered shell for auth pages
│   │   ├── routes/
│   │   │   ├── GuestRoute.jsx     # Redirects authenticated users away from auth pages
│   │   │   ├── ProtectedRoute.jsx # Redirects unauthenticated users to /login
│   │   │   ├── RootRedirect.jsx   # / → /dashboard or /explore
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── components/
│   │       ├── AuthCard.jsx
│   │       ├── AuthFooterLink.jsx
│   │       ├── LoginForm.jsx
│   │       └── RegisterForm.jsx
│   │
│   ├── user/                ↔ backend user module
│   │   ├── api/userApi.js         # getProfile, updateProfile, uploadAvatar, removeAvatar
│   │   ├── dto/user.dto.js        # toUserProfileDTO
│   │   ├── utils/avatar.js        # getAvatarUrl, readFileAsDataUrl
│   │   ├── utils/profileForm.js   # profileToFormValues
│   │   ├── routes/Profile.jsx
│   │   └── components/
│   │       ├── ProfileContent.jsx
│   │       ├── ProfileDetails.jsx
│   │       ├── ProfileEditForm.jsx
│   │       ├── ProfileField.jsx
│   │       ├── ProfilePhotoSection.jsx
│   │       ├── PhotoUploadModal.jsx
│   │       └── UserAvatar.jsx
│   │
│   ├── market/              ↔ backend market module
│   │   ├── api/marketApi.js       # getAssets, getAssetByTicker, searchMarket, quotes, ticker
│   │   ├── dto/market.dto.js      # toAssetDTO, toSearchResultDTO, toQuoteDTO, toTickerDTO
│   │   ├── constants/market.js    # asset type labels, search config, path builders
│   │   ├── hooks/
│   │   │   ├── useMarketSearch.js # debounced catalog search via RTK Query
│   │   │   └── useMarketStream.js # SSE EventSource — patches RTK Query cache on price_update
│   │   ├── routes/
│   │   │   ├── Market.jsx
│   │   │   ├── StockDetail.jsx
│   │   │   └── MutualDetail.jsx
│   │   └── components/
│   │       ├── MarketContent.jsx        # Asset list with live currentPrice column
│   │       ├── MarketQuoteCard.jsx      # compound component for price display
│   │       ├── StockDetailContent.jsx
│   │       ├── MutualDetailContent.jsx
│   │       ├── NavbarSearch.jsx         # live search dropdown in the navbar
│   │       └── OrderForm.jsx            # BUY / SELL order form
│   │
│   ├── portfolio/           ↔ backend portfolio module
│   │   ├── api/portfolioApi.js    # getPortfolioHoldings, getPortfolioSummary
│   │   ├── dto/portfolio.dto.js   # toHoldingDTO, toHoldingListDTO, toSummaryDTO
│   │   ├── constants/holdings.js  # holding type labels and tab config
│   │   ├── routes/
│   │   │   ├── Dashboard.jsx      # Portfolio stats + allocation + holdings breakdown
│   │   │   └── Holdings.jsx       # Full holdings table
│   │   └── components/
│   │       ├── DashboardContent.jsx
│   │       ├── HoldingsContent.jsx
│   │       ├── HoldingsBreakdown.jsx
│   │       ├── HoldingsTable.jsx
│   │       ├── HoldingsSectionHeader.jsx
│   │       ├── PortfolioStatsGrid.jsx
│   │       ├── PortfolioTotalValueCard.jsx
│   │       └── AssetAllocationCard.jsx
│   │
│   ├── transaction/         ↔ backend transaction module
│   │   ├── api/transactionApi.js  # getTransactions, executeOrder
│   │   └── dto/transaction.dto.js # toTransactionDTO, toTransactionHistoryDTO, toOrderResultDTO
│   │
│   ├── wallet/              ↔ backend wallet module
│   │   ├── api/walletApi.js       # getWallet
│   │   └── dto/wallet.dto.js      # toWalletDTO
│   │
│   ├── chat/                ↔ backend chat module
│   │   ├── api/chatApi.js         # sendChatMessage
│   │   ├── dto/chat.dto.js        # toChatReplyDTO
│   │   ├── constants/chat.js      # CHAT_ROLES, CHAT_LABELS, CHAT_WELCOME
│   │   ├── hooks/useChat.js       # chat message state machine
│   │   ├── utils/errors.js        # getChatErrorMessage
│   │   └── components/
│   │       ├── FloatingChatbot.jsx  # fixed-position floating chat panel
│   │       ├── ChatPanel.jsx        # compound component for the panel UI
│   │       ├── ChatPanelHeader.jsx
│   │       ├── ChatMessage.jsx
│   │       ├── ChatMessageList.jsx
│   │       └── ChatComposer.jsx
│   │
│   └── explore/             # Public landing page (no backend module equivalent)
│       ├── Explore.jsx
│       ├── ExploreHero.jsx
│       ├── ExploreCta.jsx
│       ├── FeatureHighlights.jsx
│       ├── MarketStats.jsx
│       ├── QuotesSection.jsx
│       ├── TickerStrip.jsx
│       └── constants.js
│
├── shared/
│   ├── api/
│   │   └── apiSlice.js      # Base RTK Query slice — baseQueryWithReauth (401 → refresh → retry)
│   ├── dto/
│   │   ├── helpers.js       # str, num, bool, arr safe-default coercion helpers
│   │   └── transformers.test.js  # Property-based tests for all DTO transformers
│   ├── constants/
│   │   ├── routes.js        # ROUTES frozen object — all page paths
│   │   └── apiUrls.js       # API_URLS — all /api/v1/* path strings
│   ├── hooks/
│   │   ├── useDebounce.js   # Generic debounce hook
│   │   └── useThemeMode.js  # Light / dark theme toggle + localStorage persistence
│   ├── layout/              # Application shell components (shared across features)
│   │   ├── RootLayout.jsx   # Sticky navbar + constrained main content area
│   │   ├── Navbar.jsx       # Compound navbar: brand, search, nav links, user menu, mobile drawer
│   │   ├── NavbarBrand.jsx
│   │   ├── AppPageLayout.jsx  # Page wrapper with optional FloatingChatbot slot
│   │   ├── PageHeader.jsx
│   │   ├── PageShell.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── UserMenu.jsx
│   ├── errors/              # Error infrastructure
│   │   ├── RouteErrorBoundary.jsx  # React Router errorElement handler
│   │   └── NotFoundCard.jsx        # Reusable 404 UI card
│   └── ui/                  # Design-system primitives (Radix UI + Tailwind)
│       ├── alert.jsx        # Alert variants: success, danger, warning, info
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dropdown-menu.jsx
│       ├── FormInput.jsx    # Labeled + validated input field
│       ├── FormTextarea.jsx # Labeled + validated textarea field
│       ├── GrowingMarketIcon.jsx  # Brand SVG logo
│       ├── input.jsx        # Base input primitive
│       ├── label.jsx
│       ├── progress.jsx
│       ├── sheet.jsx        # Radix Dialog used as side-drawer (mobile nav)
│       ├── spinner.jsx
│       ├── table.jsx
│       ├── tabs.jsx
│       ├── typography.jsx   # PageTitle, SectionTitle, MutedText, StatValue
│       └── index.js         # Barrel export for all primitives
│
├── theme/                   # Tailwind theme constants and mode utilities
├── lib/
│   └── utils.js             # cn() — clsx + tailwind-merge
├── App.jsx                  # Root — AuthProvider + RouterProvider
└── main.jsx                 # Vite entry point — Redux Provider + theme init
```

---

## Architectural Rules

- **Feature code lives inside its owning feature module.** Nothing from `features/auth` leaks into `features/market`, etc.
- **Features may import from `shared/`, but `shared/` never imports from `features/`.**
- **API definitions and DTOs belong to the owning feature.** Import RTK Query hooks from `features/<name>/api/<name>Api.js`, not from any central barrel.
- **`shared/ui/` is for stateless design-system primitives only.** Feature-specific business logic stays inside the feature.
- **`AuthLayout` lives in `features/auth/layout/`** because it is auth-specific UI. `RootLayout` and `AppPageLayout` live in `shared/layout/` because they are used across features.

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

| Feature file                                 | Endpoints                              | DTOs                                                           |
| -------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `features/auth/api/authApi.js`               | `getMe`, `login`, `register`, `logout` | `toAuthUserDTO`                                                |
| `features/user/api/userApi.js`               | `getProfile`, `updateProfile`, avatar  | `toUserProfileDTO`                                             |
| `features/market/api/marketApi.js`           | assets, search, quotes, ticker         | `toAssetDTO`, `toQuoteDTO`, `toTickerDTO`, `toSearchResultDTO` |
| `features/portfolio/api/portfolioApi.js`     | holdings, summary                      | `toHoldingListDTO`, `toSummaryDTO`                             |
| `features/transaction/api/transactionApi.js` | history, executeOrder                  | `toTransactionHistoryDTO`, `toOrderResultDTO`                  |
| `features/wallet/api/walletApi.js`           | getWallet                              | `toWalletDTO`                                                  |
| `features/chat/api/chatApi.js`               | sendChatMessage                        | `toChatReplyDTO`                                               |

---

## Pages

| Route                         | Feature / Page                                          | Auth       |
| ----------------------------- | ------------------------------------------------------- | ---------- |
| `/`                           | `auth/routes/RootRedirect` → `/dashboard` or `/explore` | —          |
| `/explore`                    | `explore/Explore` — public landing, live ticker strip   | —          |
| `/login`                      | `auth/routes/Login`                                     | Guest only |
| `/register`                   | `auth/routes/Register`                                  | Guest only |
| `/dashboard`                  | `portfolio/routes/Dashboard` — stats + allocation + AI  | ✅         |
| `/market`                     | `market/routes/Market` — browsable asset catalog        | ✅         |
| `/market/stocks/:symbol`      | `market/routes/StockDetail` — live price + order form   | ✅         |
| `/market/mutuals/:schemeCode` | `market/routes/MutualDetail` — NAV + order form         | ✅         |
| `/holdings`                   | `portfolio/routes/Holdings` — full P&L table            | ✅         |
| `/profile`                    | `user/routes/Profile` — view/edit profile + avatar      | ✅         |

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
npm test          # Jest unit / property tests (49 tests)
```

---

## Key Design Patterns

### Authentication

- JWTs live in **HTTP-Only cookies** set by the server. The frontend never reads the raw token.
- `AuthProvider` (in `features/auth/providers/`) calls `useGetMeQuery` on mount to hydrate Redux auth state. No `useEffect` for auth.
- `ProtectedRoute` and `GuestRoute` both live in `features/auth/routes/` — they are auth concerns.
- On 401, `baseQueryWithReauth` in `shared/api/apiSlice.js` calls `POST /api/v1/auth/refresh` transparently using a mutex so only one refresh is ever in flight.

### RTK Query (server state)

- All server state is RTK Query. No `useEffect` to sync API responses into local state.
- Each feature owns its RTK Query endpoints via `injectEndpoints` on the shared base `apiSlice`.
- Cache invalidation is tag-based: executing an order invalidates `Portfolio`, `Holdings`, `Wallet`, and `Transactions`.
- Cache is fully reset on auth state changes (login/logout) via a Redux `listenerMiddleware` in `app/store.js`.

### DTOs

- Every API response is transformed through a DTO function before entering the store. Raw server shapes never reach components.
- DTO helpers (`str`, `num`, `bool`, `arr`) guarantee safe defaults — components never need to guard against `undefined` fields.
- All DTO transformers are property-based tested in `shared/dto/transformers.test.js`.

### Forms

- All forms use **React Hook Form**. No `useState` for individual field values.
- `ProfileEditForm` uses RHF's `values` option to auto-sync form state with server data — no manual reset needed.

### Market data and live prices

- All asset data comes from the seeded internal catalog on the API. No external market API is called from the frontend.
- **`useMarketStream`** (`features/market/hooks/useMarketStream.js`) — mounted once in `RootLayout`. Opens an `EventSource` to `GET /api/v1/market/stream` when the user is authenticated. On each `price_update` SSE event it patches the RTK Query cache in-place via `apiSlice.util.updateQueryData` — no re-fetch triggered.
- Caches patched by `useMarketStream`:

  | Cache key                  | Consumer                                                       |
  | -------------------------- | -------------------------------------------------------------- |
  | `getStockQuote(ticker)`    | `StockDetailContent`                                           |
  | `getMutualQuote(ticker)`   | `MutualDetailContent`                                          |
  | `getTickerQuotes`          | `TickerStrip`                                                  |
  | `getAssets` (all variants) | `MarketContent` price column                                   |
  | `getPortfolioHoldings`     | `HoldingsContent` — currentPrice, P&L, portfolioWeight         |
  | `getPortfolioSummary`      | Dashboard stat cards — currentValue, totalPnL, totalPnLPercent |

- **Stock prices** update every second via SSE. **Mutual fund NAVs** are fixed for the day — no intra-day SSE ticks are emitted for `MUTUAL_FUND` assets.
- Polling intervals are kept as a fallback (60s for quotes and ticker) in case the SSE connection drops and reconnects.
