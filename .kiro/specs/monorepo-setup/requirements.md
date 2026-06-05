# Requirements Document

## Introduction

This feature migrates the two separate repositories (`big-bull-ui` and `big-bull-api`) into a single pnpm-workspace monorepo. The new repository will host both applications under an `apps/` directory (`apps/ui` and `apps/api`), merge their individual git histories using `git subtree`, provide workspace-level scripts for development and production, and include a `render.yaml` configuration that deploys both services to Render from the same repository.

## Glossary

- **Monorepo**: A single git repository that contains multiple related packages or applications managed together.
- **Workspace Root**: The top-level directory of the monorepo containing `pnpm-workspace.yaml`, the root `package.json`, and shared configuration files.
- **apps/ui**: The React 19 + Vite 5 frontend application, relocated from `big-bull-ui`.
- **apps/api**: The Node.js + Express 4 backend application, relocated from `big-bull-api`.
- **pnpm Workspaces**: The native pnpm feature that links packages declared in `pnpm-workspace.yaml` and hoists shared dependencies.
- **Render**: The cloud deployment platform hosting two services — a static site for `apps/ui` and a web service for `apps/api`.
- **render.yaml**: The Infrastructure-as-Code file at the Workspace Root that declares both Render services.
- **git subtree**: The git command used to merge an external repository's history into a subdirectory of the Monorepo while preserving all commits.
- **Dev Proxy**: The Vite development server configuration in `apps/ui` that forwards `/api` requests to the local `apps/api` server.

---

## Requirements

### Requirement 1 — Repository Initialisation

**User Story:** As a developer, I want a single monorepo repository initialised with pnpm workspaces, so that both applications can be managed, installed, and run from one place.

#### Acceptance Criteria

1. THE Workspace Root SHALL contain a `pnpm-workspace.yaml` file that declares `apps/*` as the workspace packages pattern.
2. THE Workspace Root SHALL contain a root `package.json` with `"name": "big-bull"`, `"private": true`, and a `packageManager` field pinned to the pnpm version used during setup.
3. WHEN `pnpm install` is run at the Workspace Root, THE pnpm Workspaces SHALL resolve and install dependencies for both `apps/ui` and `apps/api` without manual intervention in each sub-directory.
4. THE Workspace Root SHALL contain a `.gitignore` file that excludes `node_modules/`, `dist/`, `.env`, and `.DS_Store` at all directory levels.
5. THE Workspace Root SHALL contain a `.env.example` file that lists every environment variable required by `apps/api` and `apps/ui` with placeholder values and inline comments describing each variable.

---

### Requirement 2 — Package Migration

**User Story:** As a developer, I want each app to live at `apps/ui` and `apps/api` with its own `package.json` intact, so that each application remains independently configurable while participating in the workspace.

#### Acceptance Criteria

1. THE `apps/ui` directory SHALL contain all source files, configuration files, and the `package.json` previously in `big-bull-ui`, with the package `name` field updated to `"ui"`.
2. THE `apps/api` directory SHALL contain all source files, configuration files, and the `package.json` previously in `big-bull-api`, with the package `name` field updated to `"api"`.
3. THE `apps/ui/package.json` SHALL retain all existing `dependencies` and `devDependencies` entries unchanged.
4. THE `apps/api/package.json` SHALL retain all existing `dependencies` and `devDependencies` entries unchanged.
5. IF a `package-lock.json` file exists inside `apps/ui` or `apps/api` after migration, THEN THE Workspace Root setup script SHALL remove it to prevent conflict with pnpm lockfile management.

---

### Requirement 3 — Workspace-Level Scripts

**User Story:** As a developer, I want root-level npm scripts that start, build, and manage both apps together, so that I can operate the full stack from the Workspace Root without navigating into sub-directories.

#### Acceptance Criteria

1. THE root `package.json` SHALL contain a `"dev"` script that starts both `apps/ui` and `apps/api` development servers concurrently using `pnpm --filter` or a concurrency tool.
2. THE root `package.json` SHALL contain a `"build"` script that runs the Vite production build for `apps/ui` using `pnpm --filter ui build`.
3. THE root `package.json` SHALL contain a `"start"` script that starts the `apps/api` production server using `pnpm --filter api start`.
4. WHEN the `"dev"` script is executed, THE Dev Proxy in `apps/ui/vite.config.js` SHALL forward all `/api` requests to `http://localhost:4000` so that the frontend can reach the backend without CORS configuration changes.
5. THE root `package.json` SHALL contain an `"install:all"` script (or equivalent) that runs `pnpm install` to install dependencies across all workspace packages in a single command.

---

### Requirement 4 — Git History Merge

**User Story:** As a developer, I want the full commit histories of both original repositories preserved in the Monorepo, so that `git log` for any file retains its original authorship and change history.

#### Acceptance Criteria

1. WHEN the Monorepo is initialised, THE git subtree command SHALL be used to add the `big-bull-ui` repository history into the `apps/ui/` prefix of the Monorepo, preserving all original commits.
2. WHEN the Monorepo is initialised, THE git subtree command SHALL be used to add the `big-bull-api` repository history into the `apps/api/` prefix of the Monorepo, preserving all original commits.
3. AFTER both subtree operations are complete, THE Monorepo SHALL contain a linear git history where all commits from both source repositories are reachable via `git log`.
4. THE Workspace Root README SHALL document the exact `git subtree add` commands used so that the merge procedure is reproducible.

---

### Requirement 5 — Render Deployment Configuration

**User Story:** As a developer, I want a `render.yaml` at the Workspace Root that declares both services, so that Render can deploy `apps/ui` as a static site and `apps/api` as a web service from the same repository.

#### Acceptance Criteria

1. THE `render.yaml` file SHALL declare a static site service for `apps/ui` with `buildCommand` set to `pnpm install && pnpm --filter ui build` and `staticPublishPath` set to `apps/ui/dist`.
2. THE `render.yaml` file SHALL declare a web service for `apps/api` with `buildCommand` set to `pnpm install` and `startCommand` set to `pnpm --filter api start`.
3. THE `render.yaml` web service entry SHALL specify the `rootDir` or equivalent field pointing to the Workspace Root so that pnpm can resolve the full workspace during the Render build.
4. WHEN environment variables are required by `apps/api` at runtime on Render, THE `render.yaml` SHALL list each variable as an `envVars` entry with `sync: false` so that secret values are managed through the Render dashboard and not stored in the repository.
5. THE `render.yaml` file SHALL be committed to the Monorepo at the Workspace Root so that Render's Blueprint feature can detect and apply it automatically on first connection.

---

### Requirement 6 — Developer Documentation

**User Story:** As a developer onboarding to the monorepo, I want a root-level README that explains the repository structure and common workflows, so that I can get up and running without guessing commands or directory layouts.

#### Acceptance Criteria

1. THE Workspace Root SHALL contain a `README.md` that describes the top-level directory structure, including the purpose of `apps/ui`, `apps/api`, `pnpm-workspace.yaml`, and `render.yaml`.
2. THE `README.md` SHALL document the command to install all dependencies (`pnpm install` at the Workspace Root).
3. THE `README.md` SHALL document the command to start the full development environment (`pnpm dev` or equivalent).
4. THE `README.md` SHALL document the Render deployment model, including which Render service corresponds to each app and how environment variables are configured on the Render dashboard.
5. THE `README.md` SHALL document the git subtree commands used to merge the original repositories, including the remote URLs and prefix paths used.
