# BigBull Trading Dashboard — Frontend

React 19 + Vite SPA for portfolio tracking. Server data is loaded with **RTK Query**; auth session (JWT) lives in a small Redux slice. The dashboard includes a floating **BigBull AI** chat assistant backed by the API’s Gemini integration.

## Project structure

```
big-bull-ui/
├── src/
│   ├── api/
│   │   └── apiSlice.js         # RTK Query endpoints and generated hooks
│   ├── components/
│   │   ├── chat/               # Floating chatbot UI
│   │   │   ├── FloatingChatbot.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   └── ChatMessage.jsx
│   │   ├── common/             # Shared form/UI primitives
│   │   ├── holdings/           # Holdings table
│   │   ├── layout/             # Navbar, MainLayout
│   │   ├── profile/            # Avatar, profile photo upload
│   │   └── ui/                 # shadcn-style primitives (Button, Card, …)
│   ├── constants/
│   │   ├── apiUrls.js          # Backend path constants
│   │   ├── chat.js             # Chat labels, roles, welcome message
│   │   ├── holdings.js
│   │   └── routes.js           # React Router paths
│   ├── hooks/
│   │   ├── useAuth.js          # Login / register / logout
│   │   ├── useChat.js          # Chat panel state + send flow
│   │   ├── useThemeMode.js
│   │   └── ProtectedRoute.jsx
│   ├── lib/
│   │   └── utils.js            # cn() — Tailwind class merge
│   ├── pages/                  # Route-level screens
│   ├── store/
│   │   ├── slices/authSlice.js # JWT + session flags only
│   │   └── store.js
│   ├── theme/                  # Light/dark persistence
│   ├── utils/                  # Formatting, validation, portfolio helpers
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js              # Dev proxy: /api → backend
├── tailwind.config.js
├── .env.example
└── package.json
```

### Where things live

| Concern | Location | Notes |
|--------|----------|--------|
| HTTP + cached server data | `src/api/apiSlice.js` | Use exported RTK Query hooks in UI |
| Auth token / login state | `src/store/slices/authSlice.js` | Persisted via `localStorage` |
| API path strings | `src/constants/apiUrls.js` | Used by `apiSlice` only |
| AI chat UI + UX copy | `src/components/chat/`, `src/constants/chat.js` | Orchestrated by `useChat` |
| Route guards | `src/hooks/ProtectedRoute.jsx` | Requires `isAuthenticated` |

There is **no** separate `services/` layer — RTK Query handles API calls.

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

Endpoints are defined in `apiSlice.js`. Use hook `data` / `isLoading` / `error` in components — do not duplicate server state in Redux.

**Auth**

| Hook | Purpose |
|------|---------|
| `useLoginMutation` | Login (via `useAuth`) |
| `useRegisterMutation` | Register (via `useAuth`) |

**Profile**

| Hook | Purpose |
|------|---------|
| `useGetProfileQuery` | Load current user |
| `useUpdateProfileMutation` | Update name, phone, bio (`PATCH`) |
| `useUploadAvatarMutation` / `useRemoveAvatarMutation` | Profile photo |

**Holdings**

| Hook | Purpose |
|------|---------|
| `useGetHoldingsQuery` | All holdings (dashboard) |
| `useGetMutualHoldingsQuery` / `useGetStockHoldingsQuery` | Tabbed holdings page |
| `useCreateHoldingMutation` / `useUpdateHoldingMutation` / `useDeleteHoldingMutation` | CRUD |

**Chat**

| Hook | Purpose |
|------|---------|
| `useSendChatMessageMutation` | `POST /api/chat` with `{ message }`; returns `{ reply }` |

Cache tags: `Profile`, `Holdings`. Chat is not tagged — each message is a one-off mutation. On login, register, or logout, the store resets RTK Query cache so a new user never sees the previous session’s data.

## BigBull AI chat

- **`FloatingChatbot`** is mounted on **`DashboardPage`** (fixed bottom-right).
- **`useChat`** manages open/close state, message list (starts with `CHAT_WELCOME`), input, Enter-to-send, and errors from RTK Query.
- **`ChatPanel`** / **`ChatMessage`** render the conversation; user messages align right, assistant left.
- Requires an authenticated session (JWT attached by `prepareHeaders` in `apiSlice`).

## State management

**Auth slice** — session only:

- `token`, `user` (minimal fields from login), `isAuthenticated`
- Actions: `loginSuccess`, `registerSuccess`, `logout`
- `useAuth` wraps RTK mutations and dispatches these actions

**RTK Query (`api` reducer)** — server data:

- Profile, holdings, chat responses
- Loading/error flags on hooks (`isLoading`, `error`, …)

## Pages

| Route | Page | Data / features |
|-------|------|-----------------|
| `/login` | LoginPage | `useAuth` |
| `/register` | RegisterPage | `useAuth` |
| `/dashboard` | DashboardPage | `useGetHoldingsQuery`, portfolio summary UI, `FloatingChatbot` |
| `/holdings` | HoldingsPage | Mutual/stock tabs, CRUD mutations |
| `/profile` | ProfilePage | `useGetProfileQuery`, avatar upload |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_APP_NAME` | App display name (optional) |
| `VITE_API_URL` | Documented for deployments; dev uses Vite proxy (`/api` → `localhost:4000`) |

## Dependencies

- **react**, **react-dom**, **react-router-dom** — UI and routing
- **@reduxjs/toolkit**, **react-redux** — Redux + RTK Query
- **react-hook-form** — Profile form
- **tailwindcss**, **class-variance-authority**, **clsx**, **tailwind-merge** — Styling
- **@radix-ui/***, **lucide-react** — Accessible UI primitives

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
