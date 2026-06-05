# Implementation Plan: Monorepo Setup

## Overview

Migrate `big-bull-ui` and `big-bull-api` from two separate git repositories into a single pnpm-workspace monorepo under a new `big-bull/` workspace root. The migration is purely structural — no application source code changes — and produces configuration files, root scripts, a Render Blueprint, and documentation.

## Tasks

- [x] 1. Initialise workspace root and pnpm workspace configuration
  - Create the `big-bull/` workspace root directory
  - Create `pnpm-workspace.yaml` declaring `apps/*` as the workspace packages pattern
  - Create root `package.json` with `"name": "big-bull"`, `"private": true`, `"packageManager"` pinned to current pnpm version, and `devDependencies` containing `concurrently`
  - Create root `.gitignore` excluding `node_modules/`, `dist/`, `.env`, `.env.local`, `.env.*.local`, `.DS_Store`, and `pnpm-debug.log*`
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Migrate app packages into `apps/` directory
  - [x] 2.1 Copy `big-bull-ui` files into `apps/ui/` and update package name
    - Copy all source files, config files, and `package.json` from `big-bull-ui` into `apps/ui/`
    - Update `apps/ui/package.json` `"name"` field from `"big-bull-ui"` to `"ui"`; leave all dependencies unchanged
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 Write property test for UI dependency preservation (Property 1)
    - **Property 1: Dependency Preservation — UI**
    - Read original `big-bull-ui/package.json`; assert every `dependencies` and `devDependencies` entry appears with the identical version specifier in `apps/ui/package.json`
    - **Validates: Requirements 2.3**

  - [x] 2.3 Copy `big-bull-api` files into `apps/api/` and update package name
    - Copy all source files, config files, and `package.json` from `big-bull-api` into `apps/api/`
    - Update `apps/api/package.json` `"name"` field from `"big-bull-api"` to `"api"`; leave all dependencies unchanged
    - _Requirements: 2.2, 2.4_

  - [x] 2.4 Write property test for API dependency preservation (Property 2)
    - **Property 2: Dependency Preservation — API**
    - Read original `big-bull-api/package.json`; assert every `dependencies` and `devDependencies` entry appears with the identical version specifier in `apps/api/package.json`
    - **Validates: Requirements 2.4**

  - [x] 2.5 Remove residual `package-lock.json` files from both app directories
    - Delete `apps/ui/package-lock.json` if it exists (residual from previous npm usage)
    - Delete `apps/api/package-lock.json` if it exists
    - _Requirements: 2.5_

- [x] 3. Checkpoint — Verify workspace installation
  - Run `pnpm install` at workspace root and confirm exit code 0; both apps' dependencies must resolve without manual sub-directory intervention
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.3_

- [x] 4. Add root workspace scripts and verify dev proxy
  - [x] 4.1 Write root `package.json` scripts block
    - Add `"dev"` script: `concurrently "pnpm --filter ui dev" "pnpm --filter api dev"`
    - Add `"build"` script: `pnpm --filter ui build`
    - Add `"start"` script: `pnpm --filter api start`
    - Add `"install:all"` script: `pnpm install`
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 4.2 Write property test for dev proxy coverage (Property 3)
    - **Property 3: Dev Proxy Coverage**
    - Parse `apps/ui/vite.config.js`; for any URL path beginning with `/api`, assert the proxy `target` is `http://localhost:4000` and `changeOrigin` is true
    - **Validates: Requirements 3.4**

- [x] 5. Create `render.yaml` Blueprint
  - [x] 5.1 Write `render.yaml` at workspace root
    - Declare static site service `big-bull-ui`: `buildCommand: pnpm install && pnpm --filter ui build`, `staticPublishPath: apps/ui/dist`, `pullRequestPreviewsEnabled: true`
    - Declare web service `big-bull-api`: `buildCommand: pnpm install`, `startCommand: pnpm --filter api start`
    - Add `envVars` entries for `NODE_ENV` (value: production), `PORT` (value: "4000"), and all secret keys from `apps/api/.env.example` using `sync: false`
    - Commit `render.yaml` to the monorepo root
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 5.2 Write property test for render.yaml env var coverage (Property 4)
    - **Property 4: Environment Variable Coverage in render.yaml**
    - Enumerate all keys in `apps/api/.env.example` (excluding `NODE_ENV` and `PORT`); assert each appears in the `render.yaml` `envVars` list for `big-bull-api` with `sync: false`
    - **Validates: Requirements 5.4**

- [x] 6. Create root `.env.example`
  - [x] 6.1 Write merged `.env.example` at workspace root
    - Merge all env var keys from `apps/ui/.env.example` and `apps/api/.env.example` into a single root `.env.example`
    - Group variables by app with section comments (`# ── apps/ui` and `# ── apps/api`)
    - Provide placeholder values and an inline comment describing each variable
    - _Requirements: 1.5_

  - [x] 6.2 Write property test for root .env.example completeness (Property 5)
    - **Property 5: Root .env.example Completeness**
    - Enumerate all keys from both `apps/ui/.env.example` and `apps/api/.env.example`; assert every key appears in root `.env.example` with a placeholder value and an inline comment
    - **Validates: Requirements 1.5**

- [x] 7. Document git history merge procedure
  - Write a shell script (or inline code block in README) with the exact `git subtree add` commands: init new repo, `git remote add ui`, `git fetch ui`, `git subtree add --prefix=apps/ui ui main --squash=false`, `git remote add api`, `git fetch api`, `git subtree add --prefix=apps/api api main --squash=false`, then remove temporary remotes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Write root `README.md`
  - Describe top-level directory structure with purpose of `apps/ui`, `apps/api`, `pnpm-workspace.yaml`, and `render.yaml`
  - Document `pnpm install` command for dependency installation
  - Document `pnpm dev` command for full-stack development
  - Document Render deployment model: which Render service maps to each app, and how env vars are configured on the Render dashboard
  - Document the exact `git subtree` commands (or link to the script from task 7) with remote URLs and prefix paths
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Run property tests for Properties 1–5
  - Run workspace smoke test: `pnpm install --frozen-lockfile` → exit code 0
  - Assert `apps/ui/package-lock.json` and `apps/api/package-lock.json` do not exist
  - Assert `pnpm-workspace.yaml`, `render.yaml`, `.env.example`, `.gitignore`, and `README.md` exist at workspace root
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests are implemented with `fast-check` (JavaScript); install it as a root `devDependency` alongside `concurrently`
- No application source code in `apps/ui/src` or `apps/api/src` is modified at any point
- Checkpoints ensure incremental validation after structural changes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "7"] },
    { "id": 6, "tasks": ["8"] }
  ]
}
```
