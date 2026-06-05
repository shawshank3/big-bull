# Design Document — Monorepo Setup

## Overview

This design describes the one-time migration of `big-bull-ui` (React 19 + Vite 5) and `big-bull-api` (Node.js + Express 4) from two separate git repositories into a single pnpm-workspace monorepo. The result is a workspace root that orchestrates both applications, preserves their individual git histories via `git subtree`, and ships a `render.yaml` Blueprint for zero-touch Render deployment.

No application source code is modified during this migration. The change is purely structural: files move, configuration wraps them, and a root orchestration layer is added.

---

## Architecture

```
big-bull/                          ← Workspace Root (new git repo)
├── apps/
│   ├── ui/                        ← React 19 + Vite 5 (from big-bull-ui)
│   │   ├── src/
│   │   ├── index.html
│   │   ├── vite.config.js         ← proxy /api → localhost:4000
│   │   └── package.json           ← name: "ui"
│   └── api/                       ← Node.js + Express 4 (from big-bull-api)
│       ├── src/
│       ├── index.js
│       ├── scripts/
│       └── package.json           ← name: "api"
├── pnpm-workspace.yaml            ← declares apps/*
├── package.json                   ← root scripts + packageManager pin
├── render.yaml                    ← Render Blueprint (static + web service)
├── .env.example                   ← merged env vars from both apps
├── .gitignore                     ← root-level ignore rules
└── README.md                      ← onboarding + workflow docs
```

### Dependency Graph

```
Workspace Root
    │
    ├── pnpm install ──► resolves apps/ui deps  (hoisted to root node_modules)
    │                    resolves apps/api deps (hoisted to root node_modules)
    │
    ├── pnpm dev ──────► concurrently:
    │                      pnpm --filter ui dev   (Vite on :5173)
    │                      pnpm --filter api dev  (nodemon on :4000)
    │
    ├── pnpm build ────► pnpm --filter ui build   (outputs apps/ui/dist)
    └── pnpm start ────► pnpm --filter api start  (node index.js)
```

During development, the Vite dev server proxy intercepts `GET /api/*` requests from the browser and forwards them to `http://localhost:4000`, so the frontend never needs CORS or a hard-coded API origin.

---

## Components and Interfaces

This section describes every configuration file, script interface, and inter-component contract introduced by the migration.

## Components and File Specifications

### 1. `pnpm-workspace.yaml`

Declares the workspace packages pattern so pnpm discovers both apps automatically.

```yaml
packages:
  - 'apps/*'
```

### 2. Root `package.json`

Orchestrates workspace-wide scripts and pins the pnpm version.

```json
{
  "name": "big-bull",
  "private": true,
  "packageManager": "pnpm@9.x.x",
  "scripts": {
    "dev": "concurrently \"pnpm --filter ui dev\" \"pnpm --filter api dev\"",
    "build": "pnpm --filter ui build",
    "start": "pnpm --filter api start",
    "install:all": "pnpm install"
  },
  "devDependencies": {
    "concurrently": "^8.x.x"
  }
}
```

`concurrently` is the only root-level dev dependency. It runs both `dev` processes in parallel with labeled output and unified signal handling (Ctrl-C kills both).

### 3. `apps/ui/package.json` — name field update

The only change to the UI package.json is updating `"name"` from `"big-bull-ui"` to `"ui"`. All dependencies remain verbatim.

```json
{
  "name": "ui",
  "private": true,
  "type": "module",
  ...
}
```

### 4. `apps/api/package.json` — name field update

The only change to the API package.json is updating `"name"` from `"big-bull-api"` to `"api"`. All dependencies remain verbatim.

```json
{
  "name": "api",
  "version": "0.1.0",
  "private": true,
  ...
}
```

### 5. `apps/ui/vite.config.js` — Dev Proxy

The existing vite config already contains the correct proxy. No changes needed.

```js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
}
```

### 6. `render.yaml`

Render Blueprint declaring both services. Secret env vars use `sync: false` so values are managed in the Render dashboard, never in the repo.

```yaml
services:
  # ── Static Site (apps/ui) ───────────────────────────────────────────
  - type: web
    name: big-bull-ui
    runtime: static
    buildCommand: pnpm install && pnpm --filter ui build
    staticPublishPath: apps/ui/dist
    pullRequestPreviewsEnabled: true

  # ── Web Service (apps/api) ──────────────────────────────────────────
  - type: web
    name: big-bull-api
    runtime: node
    buildCommand: pnpm install
    startCommand: pnpm --filter api start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "4000"
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_ACCESS_EXPIRES
        sync: false
      - key: JWT_REFRESH_EXPIRES
        sync: false
      - key: GEMENI_API_KEY
        sync: false
      - key: ALPHA_VANTAGE_API_KEY
        sync: false
```

> Both services are declared at the workspace root; Render's Blueprint feature resolves build commands from the root directory so pnpm workspace resolution works correctly.

### 7. Root `.env.example`

Merged from both apps' `.env.example` files, with all variables annotated.

```dotenv
# ── apps/ui ────────────────────────────────────────────────────────────
# Base URL used by the frontend to reach the API (only used in production builds)
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=BigBull

# ── apps/api ───────────────────────────────────────────────────────────
PORT=4000
NODE_ENV=development

# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/bigbull

# JWT secret — use a long random string in production
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_ACCESS_EXPIRES=7d
JWT_REFRESH_EXPIRES=30d

# Google AI Studio key — https://aistudio.google.com/apikey
GEMENI_API_KEY=your_gemini_api_key_here

# Alpha Vantage key — https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

### 8. Root `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment secrets
.env
.env.local
.env.*.local

# macOS metadata
.DS_Store

# pnpm debug log
pnpm-debug.log*
```

---

## Data Models

This migration introduces no new runtime data models. The only structured data files are:

| File | Schema | Purpose |
|------|--------|---------|
| `pnpm-workspace.yaml` | YAML list of glob patterns | Workspace package discovery |
| `render.yaml` | Render Blueprint YAML | Deployment declaration |
| `root package.json` | npm package manifest | Script orchestration |
| `.env.example` | KEY=value lines | Environment variable documentation |

---

## Git History Merge Procedure

The subtree merge is a one-time manual procedure run during initial setup. The exact commands:

```bash
# 1. Initialise the new monorepo
mkdir big-bull && cd big-bull
git init

# 2. Merge big-bull-ui history → apps/ui
git remote add ui https://github.com/<org>/big-bull-ui.git
git fetch ui
git subtree add --prefix=apps/ui ui main --squash=false

# 3. Merge big-bull-api history → apps/api
git remote add api https://github.com/<org>/big-bull-api.git
git fetch api
git subtree add --prefix=apps/api api main --squash=false

# 4. Remove temporary remotes (optional, keeps remote list clean)
git remote remove ui
git remote remove api
```

`--squash=false` preserves every original commit. After both operations `git log --oneline` will show a merge commit for each subtree add, followed by all original commits from both repos interleaved chronologically.

---

## Error Handling

| Scenario | Cause | Resolution |
|----------|-------|------------|
| `pnpm install` fails with workspace resolution error | `pnpm-workspace.yaml` missing or `apps/*` glob not matching | Verify file exists at root and both `apps/ui` and `apps/api` contain a `package.json` |
| `package-lock.json` present in an app directory | Residual file from previous npm usage | Delete `apps/ui/package-lock.json` and `apps/api/package-lock.json`; run `pnpm install` |
| `concurrently` not found when running `pnpm dev` | Root `devDependencies` not installed | Run `pnpm install` at workspace root first |
| Vite proxy returns 503 in dev | `apps/api` not started yet | Ensure both processes started via `pnpm dev`; `concurrently` starts them together |
| Render build fails with `workspace:*` resolution error | Render not running from workspace root | Confirm `render.yaml` is at repo root and no `rootDir` points to a sub-directory |
| `git subtree add` fails with "prefix already exists" | Partial previous attempt | Remove the target directory, reset the commit, and retry |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dependency Preservation — UI

*For any* dependency entry (name + version) that exists in the original `big-bull-ui` `package.json` `dependencies` or `devDependencies`, that exact entry SHALL appear with the same version specifier in `apps/ui/package.json`.

**Validates: Requirements 2.3**

---

### Property 2: Dependency Preservation — API

*For any* dependency entry (name + version) that exists in the original `big-bull-api` `package.json` `dependencies` or `devDependencies`, that exact entry SHALL appear with the same version specifier in `apps/api/package.json`.

**Validates: Requirements 2.4**

---

### Property 3: Dev Proxy Coverage

*For any* URL path string that begins with `/api`, the Vite server proxy configuration in `apps/ui/vite.config.js` SHALL route that request to `http://localhost:4000`, preserving the original path.

**Validates: Requirements 3.4**

---

### Property 4: Environment Variable Coverage in render.yaml

*For any* environment variable key declared in `apps/api/.env.example` (excluding `NODE_ENV` and `PORT` which have static values), that key SHALL appear as an entry in the `render.yaml` `envVars` list for the `big-bull-api` service with `sync: false`.

**Validates: Requirements 5.4**

---

### Property 5: Root .env.example Completeness

*For any* environment variable key declared in either `apps/ui/.env.example` or `apps/api/.env.example`, that key SHALL appear in the root `.env.example` file with a placeholder value and an inline comment.

**Validates: Requirements 1.5**


---

## Testing Strategy

### Unit / Example Tests

Since the migration produces configuration files rather than application logic, the primary verification approach is configuration assertion tests:

- **Workspace resolution smoke test**: Run `pnpm install --frozen-lockfile` and assert exit code 0.
- **Script existence tests**: Parse root `package.json` and assert `dev`, `build`, `start`, and `install:all` scripts are present with the correct `pnpm --filter` commands.
- **File presence tests**: Assert `pnpm-workspace.yaml`, `render.yaml`, `.env.example`, `.gitignore`, and `README.md` exist at the workspace root.
- **package-lock removal test**: After setup script execution, assert `apps/ui/package-lock.json` and `apps/api/package-lock.json` do not exist.

### Property-Based Tests

Property tests validate universal invariants of the migration. Implemented with a framework such as fast-check (JavaScript):

| Property | Approach |
|----------|----------|
| Dependency preservation (UI) | Enumerate original package.json entries; assert each appears in apps/ui/package.json |
| Dependency preservation (API) | Enumerate original package.json entries; assert each appears in apps/api/package.json |
| Dev proxy coverage | Generate path strings prefixed with "/api"; assert vite config proxy target is localhost:4000 |
| render.yaml env var coverage | Enumerate .env.example keys for apps/api; assert each appears in render.yaml envVars with sync: false |
| Root .env.example completeness | Enumerate all keys from both apps' .env.example; assert each appears in root .env.example |

### Integration Tests

- **pnpm workspace install**: Run `pnpm install` from the workspace root in a clean environment; verify both app `node_modules` are properly resolved.
- **Git history reachability**: After `git subtree add` operations, run `git log --all --oneline` and verify commit SHAs from both source repos are present.
- **Render build simulation**: Run `pnpm install && pnpm --filter ui build` locally to simulate the Render static site build; assert `apps/ui/dist/index.html` is produced.
