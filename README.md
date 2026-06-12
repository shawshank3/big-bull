# BigBull Monorepo

A pnpm-workspace monorepo containing the BigBull full-stack application — a React 19 + Vite 5 frontend (`apps/ui`) and a Node.js + Express 4 backend (`apps/api`).

---

## Directory Structure

```
big-bull/
├── apps/
│   ├── ui/                  React 19 + Vite 5 frontend (SPA)
│   │                        Vite dev server on :5173; proxies /api → localhost:4000
│   └── api/                 Node.js + Express 4 REST API
│                            Express server on :4000
├── pnpm-workspace.yaml      Declares apps/* as workspace packages so pnpm
│                            resolves and hoists dependencies from a single
│                            root install
├── render.yaml              Render Blueprint — deploys the full-stack app
│                            to Render from this repository
├── package.json             Root scripts: dev, build, start, install:all
├── .env.example             All environment variables for both apps with
│                            placeholder values and inline comments
├── .gitignore               Excludes node_modules/, dist/, .env, .DS_Store
└── README.md                This file
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/installation) v9 or later (`npm install -g pnpm`)

### Install dependencies

Run this once from the workspace root. pnpm resolves and installs dependencies for both `apps/ui` and `apps/api` in a single pass.

```bash
pnpm install
```

### Environment variables

Copy the root example file and fill in real values:

```bash
cp .env.example .env
```

See `.env.example` for descriptions of every variable. The API reads from `apps/api/.env`; copy there too if you prefer per-app env files:

```bash
cp apps/api/.env.example apps/api/.env
```

---

## Development

Start both the frontend and backend development servers concurrently from the workspace root:

```bash
pnpm dev
```

This runs:

| Process | Command | URL |
|---------|---------|-----|
| Frontend (Vite) | `pnpm --filter ui dev` | http://localhost:5173 |
| Backend (nodemon) | `pnpm --filter api dev` | http://localhost:4000 |

The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:4000`, so you never need to configure CORS or hard-code API origins during development.

### Other root scripts

| Script | Command | What it does |
|--------|---------|--------------|
| Build frontend | `pnpm build` | Runs `pnpm --filter ui build` → outputs `apps/ui/dist/` |
| Start API (prod) | `pnpm start` | Runs `pnpm --filter api start` |
| Re-install all | `pnpm install:all` | Alias for `pnpm install` at root |

---

## Deployment (Render)

The `render.yaml` file at the workspace root is a [Render Blueprint](https://render.com/docs/infrastructure-as-code). Connect this repository to Render once and both services are created automatically.

### Services

| Render service | Type | Source | Build command | Serve / start |
|----------------|------|--------|---------------|---------------|
| `big-bull` | Web service | workspace root | `pnpm install && pnpm --filter ui build` | `pnpm --filter api start` |

### Environment variables on Render

Secret variables are **not** stored in `render.yaml`. They are listed with `sync: false`, which means Render expects you to set their values manually in the dashboard.

For the `big-bull` service, go to **Render Dashboard → big-bull → Environment** and set:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing JWTs |
| `JWT_ACCESS_EXPIRES` | Access token lifetime (e.g. `7d`) |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime (e.g. `30d`) |
| `GEMENI_API_KEY` | Google AI Studio key |
| `REDIS_URL` | Redis connection string for price cache and BullMQ (recommended)

`NODE_ENV` and `PORT` are set automatically by `render.yaml` (`production` and `4000` respectively) and do not need to be entered manually.

---

## License

MIT — see [LICENSE](LICENSE) (if present in each app directory).
