# BigBull Trading Dashboard — Frontend

React + Vite SPA for portfolio tracking. Server data is loaded with **RTK Query**; auth session (token) lives in a small Redux slice.

## Project structure

```
big-bull-ui/
├── src/
│   ├── api/
│   │   └── apiSlice.js       # RTK Query: endpoints, cache, generated hooks
│   ├── components/
│   │   ├── common/           # Shared form/UI primitives
│   │   ├── holdings/         # Holdings-specific UI
│   │   ├── layout/           # Navbar, MainLayout
│   │   ├── profile/          # Avatar, profile photo upload
│   │   └── ui/               # shadcn-style primitives (Button, Card, …)
│   ├── constants/
│   │   ├── apiUrls.js        # Backend path constants
│   │   ├── holdings.js
│   │   └── routes.js         # React Router paths
│   ├── hooks/
│   │   ├── useAuth.js        # Login / register / logout orchestration
│   │   ├── useThemeMode.js
│   │   └── ProtectedRoute.jsx
│   ├── lib/
│   │   └── utils.js          # cn() helper (Tailwind class merge)
│   ├── pages/                # Route-level screens
│   ├── store/
│   │   ├── slices/
│   │   │   └── authSlice.js  # JWT + session flags only (not profile/holdings)
│   │   └── store.js          # Redux store + RTK Query middleware
│   ├── theme/                # Light/dark theme persistence
│   ├── utils/                # Formatting, validation, avatar helpers
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js            # Dev proxy: /api → backend
├── tailwind.config.js
├── .env.example
└── package.json
```

### Where things live

| Concern | Location | Notes |
|--------|----------|--------|
| HTTP + cached server data | `src/api/apiSlice.js` | Use exported hooks (`useGetProfileQuery`, …) in UI |
| Auth token / login state | `src/store/slices/authSlice.js` | Persisted to `localStorage` |
| API path strings | `src/constants/apiUrls.js` | Used by `apiSlice` only |
| Route guards | `src/hooks/ProtectedRoute.jsx` | Requires `isAuthenticated` |

There is **no** `services/` layer: RTK Query replaces a separate axios service module.

## Getting started

### Prerequisites

- Node.js 18+
- [big-bull-api](https://github.com/your-org/big-bull-api) running on `http://localhost:4000`

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

App: `http://localhost:5173`  
API requests go to `/api/*` and are proxied to the backend (see `vite.config.js`).

### Production build

```bash
npm run build
npm run preview
```

## API integration (RTK Query)

All backend calls are defined in `apiSlice.js`. Pages and components should read **`data` from RTK hooks**, not duplicate that state in Redux or `localStorage`.

**Auth (mutations + session)**

| Hook | Purpose |
|------|---------|
| `useLoginMutation` | Login (via `useAuth`) |
| `useRegisterMutation` | Register (via `useAuth`) |

**Profile**

| Hook | Purpose |
|------|---------|
| `useGetProfileQuery` | Load current user profile |
| `useUpdateProfileMutation` | Update name, phone, bio |
| `useUploadAvatarMutation` / `useRemoveAvatarMutation` | Profile photo |

**Holdings**

| Hook | Purpose |
|------|---------|
| `useGetHoldingsQuery` | All holdings (dashboard) |
| `useGetMutualHoldingsQuery` / `useGetStockHoldingsQuery` | Tabbed holdings page |
| `useCreateHoldingMutation` / `useUpdateHoldingMutation` / `useDeleteHoldingMutation` | CRUD |

Cache tags: `Profile`, `Holdings`. On login, register, or logout, the store resets RTK Query cache so a new user never sees the previous session’s data.

## State management

**Auth slice** — session only:

- `token`, `user` (minimal fields from login response), `isAuthenticated`
- Actions: `loginSuccess`, `registerSuccess`, `logout`
- `useAuth` hook wraps RTK mutations and dispatches these actions

**RTK Query (`api` reducer)** — server data:

- Profile, holdings, and related responses
- Automatic loading/error flags on hooks (`isLoading`, `error`, …)

## Pages

| Route | Page | Data source |
|-------|------|-------------|
| `/login` | LoginPage | `useAuth` |
| `/register` | RegisterPage | `useAuth` |
| `/dashboard` | DashboardPage | `useGetHoldingsQuery` |
| `/holdings` | HoldingsPage | `useGetMutualHoldingsQuery`, `useGetStockHoldingsQuery` |
| `/profile` | ProfilePage | `useGetProfileQuery` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_APP_NAME` | App display name (optional) |
| `VITE_API_URL` | Documented for deployments; dev uses Vite proxy (`/api` → `localhost:4000`) |

## Dependencies

- **react**, **react-router-dom** — UI and routing
- **@reduxjs/toolkit**, **react-redux** — Redux + RTK Query
- **react-hook-form** — Profile form
- **tailwindcss** — Styling
- **@radix-ui/***, **lucide-react** — Accessible UI primitives

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## License

MIT
