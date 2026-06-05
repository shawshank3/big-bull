# BigBull Trading Dashboard — Frontend

React 19 + Vite SPA for portfolio tracking. Server data is loaded with **RTK Query**; auth session (access + refresh JWT) lives in a Redux slice persisted to `localStorage`. The dashboard includes a floating **BigBull AI** chat assistant backed by the API’s Gemini integration.

## Project structure

```
big-bull-ui/
├── src/
│   ├── api/
│   │   └── apiSlice.js           # RTK Query endpoints, reauth, generated hooks
│   ├── components/
│   │   ├── auth/                 # LoginForm, RegisterForm, AuthCard, AuthFooterLink
│   │   ├── chat/                 # Floating chatbot (panel, composer, message list)
│   │   ├── common/             # Re-exports of ui primitives + shared Input/FormTextarea
│   │   ├── dashboard/          # Portfolio summary cards, DashboardContent
│   │   ├── errors/             # NotFoundCard
│   │   ├── holdings/           # HoldingsBreakdown, HoldingsTable, HoldingsContent
│   │   ├── layout/             # AppPageLayout, AuthLayout, Navbar, theme toggle
│   │   ├── market/             # Market detail content and quote cards
│   │   ├── profile/            # Profile edit, avatar upload, ProfileContent
│   │   └── ui/                 # shadcn-style primitives (Button, Card, Tabs, …)
│   ├── constants/
│   │   ├── apiUrls.js          # Backend path constants
│   │   ├── chat.js             # Chat labels, roles, welcome message
│   │   ├── holdings.js         # Holding types and tab config
│   │   └── routes.js           # React Router paths
│   ├── hooks/
│   │   ├── useAuth.js          # Login / register / logout
│   │   ├── useChat.js          # Chat panel state + send flow
│   │   └── useThemeMode.js     # Light/dark toggle
│   ├── routes/
│   │   ├── router.jsx          # createBrowserRouter route config
│   │   ├── auth/               # Login, Register, GuestRoute
│   │   ├── app/                # ProtectedRoute, RootRedirect
│   │   ├── dashboard/          # Dashboard route view
│   │   ├── explore/            # Landing/explore page view
│   │   ├── holdings/           # Holdings route view
│   │   ├── market/             # Market stock and mutual detail views
│   │   ├── profile/            # Profile route view
│   │   └── not-found/          # 404 route view
│   ├── lib/
│   │   └── utils.js            # cn() — Tailwind class merge
│   ├── store/
│   │   ├── slices/authSlice.js # JWT, refresh token, user, session flags
│   │   └── store.js            # Listener resets RTK Query cache on auth changes
│   ├── theme/                  # Theme tokens, persistence, applyThemeMode
│   ├── utils/                  # Formatting, validation, portfolio helpers, localStorage
│   ├── App.jsx
│   └── main.jsx
├── components.json               # shadcn/ui config (@/ aliases)
├── index.html
├── vite.config.js                # Dev proxy: /api → backend; @ → src
├── tailwind.config.js
├── .env.example
└── package.json
```

### Architecture notes

| Layer | Location | Notes |
|--------|----------|--------|
| Routes | `src/routes/{auth,dashboard,explore,holdings,market,profile,not-found}/` | Route views: layout shell + feature component from `components/` |
| Feature UI | `src/components/{dashboard,holdings,market,auth}/` | Data fetching and presentation |
| HTTP + cache | `src/api/apiSlice.js` | Use exported RTK Query hooks; no separate `services/` layer |
| Session | `src/store/slices/authSlice.js` | `token`, `refreshToken`, `user`, `isAuthenticated` |
| API paths | `src/constants/apiUrls.js` | Consumed by `apiSlice` only |
| Shared UI | `src/components/common/` | Barrel over `ui/` + a few form helpers |

Path alias: `@` resolves to `src/` (see `vite.config.js` and `components.json`).

## Getting started

### Prerequisites

- Node.js 18+
- [big-bull-api](../big-bull-api) running on `http://localhost:4000` with `GEMENI_API_KEY` set for chat

### Install

```bash
cd big-bull-ui
npm install
cp .env.example .env
```

### Development

```bash
npm run dev
```

- App: `http://localhost:5173`
- API: requests to `/api/*` are proxied to `http://localhost:4000` (`vite.config.js`)

### Production build

```bash
npm run build
npm run preview
```

## API integration (RTK Query)

Endpoints live in `apiSlice.js`. Components should use hook `data` / `isLoading` / `error` — do not duplicate server state in Redux.

**Base query behavior**

- Sends `Authorization: Bearer <accessToken>` on requests.
- On `401`, attempts `POST /auth/refresh` with the stored refresh token, retries once, or dispatches `logout` if refresh fails.

**Auth**

| Hook | Purpose |
|------|---------|
| `useLoginMutation` | Login (via `useAuth`) |
| `useRegisterMutation` | Register (via `useAuth`) |
| `useLogoutMutation` | Server logout (via `useAuth`) |

**Profile**

| Hook | Purpose |
|------|---------|
| `useGetProfileQuery` | Load current user |
| `useUpdateProfileMutation` | Update name, phone, bio (`PATCH`) |
| `useUploadAvatarMutation` / `useRemoveAvatarMutation` | Profile photo |

**Holdings**

| Hook | Purpose |
|------|---------|
| `useGetHoldingsQuery` | All holdings (used by dashboard and holdings pages) |
| `useGetMutualHoldingsQuery` / `useGetStockHoldingsQuery` | Typed lists (exported; not used in UI yet) |
| `useCreateHoldingMutation` / `useUpdateHoldingMutation` / `useDeleteHoldingMutation` | CRUD (exported; not wired in UI yet) |

**Chat**

| Hook | Purpose |
|------|---------|
| `useSendChatMessageMutation` | `POST /api/chat` with `{ message }`; returns `{ reply }` |

**Market (search & quotes)**

| Hook | Purpose |
|------|---------|
| `useLazySearchMarketQuery` | Debounced navbar search (`GET /api/market/search?q=`) |
| `useGetStockQuoteQuery` | Today's stock price for detail page |
| `useGetMutualQuoteQuery` | Today's NAV for detail page |

Cache tags: `Profile`, `Holdings`. Chat is not tagged — each message is a one-off mutation.

On `loginSuccess`, `registerSuccess`, or `logout`, a store listener dispatches `apiSlice.util.resetApiState()` so a new session never sees the previous user’s cached data.

## Pages and routes

| Route | Page | Features |
|-------|------|----------|
| `/` | — | Redirects to `/dashboard` or `/explore` |
| `/login` | `routes/auth/Login` | `AuthLayout` + `LoginForm` + `useAuth` |
| `/register` | `routes/auth/Register` | `AuthLayout` + `RegisterForm` + `useAuth` |
| `/dashboard` | `routes/dashboard/Dashboard` | Portfolio stats, allocation, holdings breakdown; `FloatingChatbot` via `AppPageLayout showChatbot` |
| `/holdings` | `routes/holdings/Holdings` | Mutual/stock tabs (`HoldingsBreakdown`) |
| `/profile` | `routes/profile/Profile` | View/edit profile, avatar upload |
| `/market/stocks/:symbol` | `routes/market/StockDetail` | Market stock quote (not user holdings) |
| `/market/mutuals/:schemeCode` | `routes/market/MutualDetail` | Market MF NAV (not user holdings) |
| `/explore` | `routes/explore/Explore` | Public landing/explore page, no auth required |
| `*` | `routes/not-found/NotFound` | `NotFoundCard` inside `AuthLayout` |

Protected routes use `ProtectedRoute`; login/register use `GuestRoute` (both read `isAuthenticated` from Redux).

## Layout and theming

- **`AppPageLayout`** — `MainLayout` (navbar) → `PageShell` → page content; optionally mounts **`FloatingChatbot`** when `showChatbot` is true.
- **`AuthLayout`** — Centered layout for login, register, and 404.
- **`Navbar`** — Brand, center **`NavbarSearch`** (stocks + mutual funds via `/api/market`), **`ThemeToggle`**, **`UserMenu`**.
- Theme mode is applied on boot in `main.jsx` (`getInitialThemeMode` / `applyThemeMode`) and persisted under `bigbull-theme-mode`.

## BigBull AI chat

- **`FloatingChatbot`** is shown on the dashboard (`AppPageLayout showChatbot`).
- **`useChat`** — open/close state, message list (starts with `CHAT_WELCOME`), input, Enter-to-send, RTK Query errors.
- **`ChatPanel`** composes **`ChatPanelHeader`**, **`ChatMessageList`** (`ChatMessage`), and **`ChatComposer`**.
- Requires an authenticated session (JWT attached in `prepareHeaders`).

## State management

**Auth slice** — client session:

- `token`, `refreshToken`, `user`, `isAuthenticated`, loading/error flags for auth actions
- Actions: `loginSuccess`, `registerSuccess`, `tokenRefreshed`, `logout`, etc.
- Persisted to `localStorage` via `utils/localStorage.js`

**RTK Query (`api` reducer)** — server data:

- Profile, holdings, chat responses
- Loading/error on hooks (`isLoading`, `error`, …)

**`useAuth`** — wraps login/register/logout mutations, dispatches auth actions, navigates after success.

## Holdings UI

Dashboard and holdings pages both call **`useGetHoldingsQuery`**. **`HoldingsBreakdown`** splits holdings client-side into mutual-fund and stock tabs (`constants/holdings.js`). The dashboard variant can link to the full holdings page (`showNavigate`). Holdings are **read-only** in the UI today; CRUD hooks exist in `apiSlice` for future forms.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_APP_NAME` | App display name (optional) |
| `VITE_API_URL` | Documented for deployments; dev uses Vite proxy (`/api` → `localhost:4000`) |

## Dependencies

- **react**, **react-dom**, **react-router-dom** — UI and routing
- **@reduxjs/toolkit**, **react-redux** — Redux + RTK Query
- **react-hook-form** — Profile edit form
- **tailwindcss**, **class-variance-authority**, **clsx**, **tailwind-merge** — Styling
- **@radix-ui/***, **lucide-react** — Accessible UI primitives (shadcn-style components in `src/components/ui/`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |

## License

MIT
