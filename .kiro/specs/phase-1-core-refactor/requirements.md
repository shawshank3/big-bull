# Requirements — Phase 1: Core Architecture Refactor

## Overview
Refactor the existing BigBull codebase from a horizontal structure into the domain-driven vertical module architecture defined in the plan docs. Establish all shared infrastructure (catchAsync, AppError, unified response format, HTTP-Only cookie auth, Zod validation, Redis caching, BullMQ worker skeleton, SSE endpoint, VirtualWallet) that all future phases depend on.

The existing app must remain fully functional throughout. Old horizontal files are kept until their module replacement is live and tested.

---

## R1 — Backend Shared Infrastructure

**R1.1** A `catchAsync(fn)` wrapper must exist in `apps/api/src/shared/catchAsync.js`. It wraps any async Express controller function and forwards unhandled rejections to the Express error handler via `next(err)`.

**R1.2** An `AppError` class must exist in `apps/api/src/shared/AppError.js`. It extends the native `Error` class and accepts `(message, statusCode)`. It must set `this.isOperational = true` so the global error handler can distinguish expected failures from programming errors.

**R1.3** The global error handler in `apps/api/src/middleware/errorHandler.js` must be updated to:
- Return the unified response format: `{ success: false, data: null, error: { code, message }, timestamp }`
- Handle `AppError` instances (use their `statusCode`)
- Handle unexpected errors (return 500, never leak stack traces in production)

**R1.4** The `sendSuccess` utility in `apps/api/src/utils/response.js` must return the unified format: `{ success: true, data, error: null, timestamp: new Date().toISOString() }`.

**R1.5** A `validateEnv()` function must run before `server.listen()` in `apps/api/index.js`. It must check for: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. If any are missing it logs the missing key and calls `process.exit(1)`.

---

## R2 — Auth Module Migration (HTTP-Only Cookie JWT)

**R2.1** The auth system must switch from `Authorization: Bearer` header tokens to **HTTP-Only, Secure, SameSite=Strict cookies**. The access token cookie name is `access_token`. The refresh token cookie name is `refresh_token`.

**R2.2** `POST /api/v1/auth/register` must create a new user, issue both cookies, and return user profile data (no token values in the response body).

**R2.3** `POST /api/v1/auth/login` must validate credentials, issue both cookies, and return user profile data.

**R2.4** `POST /api/v1/auth/logout` must clear both cookies and invalidate the refresh token.

**R2.5** `GET /api/v1/auth/me` must return the authenticated user's profile. This endpoint is used by the frontend on app load to hydrate auth state.

**R2.6** `POST /api/v1/auth/refresh` must read the refresh token from the `refresh_token` cookie (not request body), validate it, and issue a new access token cookie with rotation.

**R2.7** `authMiddleware.js` must read the JWT from the `access_token` cookie (not the `Authorization` header).

**R2.8** The User model must add a `role` field: `Enum ["CLIENT", "ADVISOR"]`, default `"CLIENT"`.

**R2.9** All auth routes must be mounted at `/api/v1/auth/*`.

**R2.10** All auth controllers must use `catchAsync` — no bare try/catch blocks.

**R2.11** All auth request bodies must be validated with a Zod schema defined in `apps/api/src/modules/auth/auth.validator.js` before any controller logic runs.

---

## R3 — Transaction Module (New — Source of Truth)

**R3.1** A `Transaction` Mongoose model must be created at `apps/api/src/modules/transaction/transaction.model.js` with fields: `userId` (ObjectId, indexed), `assetId` (ObjectId, indexed), `transactionType` (Enum: "BUY", "SELL"), `quantity` (Number, positive), `pricePerUnit` (Number, positive), `fees` (Number, default 0), `notes` (String, optional), `executedAt` (Date, indexed, default: now).

**R3.2** `POST /api/v1/transactions/order` must execute a BUY or SELL:
- Validate the request body via Zod schema
- For BUY: check wallet balance ≥ (quantity × pricePerUnit + fees). If insufficient, return 400.
- For BUY: debit the wallet atomically with the transaction write
- For SELL: check the user holds enough quantity (derived from Transaction aggregation). If not, return 400.
- For SELL: credit the wallet atomically
- Write the Transaction document

**R3.3** `GET /api/v1/transactions` must return paginated transaction history for the authenticated user, sorted by `executedAt` descending. Supports `?page=1&limit=20`.

**R3.4** All transaction routes require authentication. All request validation uses Zod.

---

## R4 — Portfolio Module (Computed from Transactions)

**R4.1** A portfolio module must exist at `apps/api/src/modules/portfolio/`. It has no model (portfolio state is computed, never stored).

**R4.2** `GET /api/v1/portfolio/holdings` must return per-asset holdings derived exclusively from Transaction aggregation: `{ assetId, ticker, name, assetType, quantity, avgCostBasis, currentPrice, currentValue, unrealisedPnL, unrealisedPnLPercent, portfolioWeight }`. Current price comes from Redis cache (key: `price:<ticker>`). If not in cache, falls back to the Asset document's `basePrice`.

**R4.3** `GET /api/v1/portfolio/summary` must return: `{ totalInvested, currentValue, totalPnL, totalPnLPercent, dayChange, holdingCount, cashBalance }`. All values derived from Transactions + live prices.

**R4.4** The old `Holding` model and `holdingsController.js` must remain untouched during Phase 1. The new portfolio module routes at `/api/v1/portfolio/*` run alongside the old `/api/holdings/*` routes.

---

## R5 — Asset & Market Module

**R5.1** An `Asset` Mongoose model must be created at `apps/api/src/modules/asset/asset.model.js` with all fields from `05-database-schema.md`: `ticker` (unique, indexed), `name`, `assetType` (STOCK/MUTUAL_FUND), `exchange` (NSE/BSE, stocks only), `isin` (indexed), `sector`, `volatility`, `basePrice`, `lastUpdated`.

**R5.2** All market routes must be remounted at `/api/v1/market/*` (the existing `/api/market/*` routes can remain as aliases during transition).

**R5.3** `GET /api/v1/market/search?q=` must search assets. Backed by Redis autocomplete cache with a 5-minute TTL. Falls back to Alpha Vantage / MFAPI if not cached.

**R5.4** `GET /api/v1/market/quote/:ticker` must return the current price. Served from Redis (`price:<ticker>`, TTL: 60s). If stale/missing, fetches from external source, writes to Redis, and returns.

---

## R6 — VirtualWallet Module

**R6.1** A `VirtualWallet` Mongoose model must exist at `apps/api/src/modules/wallet/wallet.model.js` with fields: `userId` (ObjectId, unique, indexed), `balance` (Number, default: 1000000), `updatedAt` (Date).

**R6.2** On user registration, a `VirtualWallet` document must be created for the new user with `balance: 1000000` (₹10,00,000).

**R6.3** `GET /api/v1/wallet` must return the authenticated user's current wallet balance.

**R6.4** Wallet balance changes must only happen atomically alongside a Transaction write. No standalone balance update endpoint.

---

## R7 — Redis Caching Infrastructure

**R7.1** A Redis client singleton must exist at `apps/api/src/shared/redis.js`. It connects to the URL specified in the `REDIS_URL` environment variable using `ioredis`.

**R7.2** If `REDIS_URL` is not set, the app must log a warning and continue running without Redis (graceful degradation — cache misses fall through to the database/external API).

**R7.3** The market quote endpoint must implement the cache-aside pattern: check Redis first (TTL 60s), serve if fresh, else fetch externally, write to Redis, return.

---

## R8 — BullMQ Worker Skeleton

**R8.1** A BullMQ queue configuration must exist at `apps/api/src/config/bullmq.js`. It exports queue instances for: `mse-price-tick`, `net-worth-snapshot`, `goal-status-sync`.

**R8.2** A worker entry point must exist at `apps/api/src/workers/index.js` that imports and initialises all workers. This file is the start target for the separate Render worker service.

**R8.3** The MSE price tick worker (`apps/api/src/workers/mseWorker.js`) must be created as a skeleton: it registers with the `mse-price-tick` queue and logs that it processed a tick. Full price simulation logic is not required in Phase 1 — the infrastructure scaffold is.

**R8.4** The price tick job must be scheduled to repeat every 30 seconds via BullMQ's `repeat` option.

---

## R9 — SSE Endpoint

**R9.1** `GET /api/v1/market/stream` must establish a Server-Sent Events connection. It sets the correct SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).

**R9.2** The endpoint must send a `connected` event immediately on connection.

**R9.3** The endpoint must send a heartbeat comment (`: heartbeat\n\n`) every 30 seconds to keep the connection alive through proxies.

**R9.4** In Phase 1, the SSE stream sends mock price tick events at 30-second intervals. Real MSE price data integration is Phase 1 completion + ongoing.

**R9.5** The connection must be cleaned up (client removed from the broadcast list) when the client disconnects.

---

## R10 — Frontend Auth Migration

**R10.1** The frontend `authSlice.js` must remove all token storage from `localStorage`/`sessionStorage`. Auth state is derived from the server — the raw JWT is never stored client-side.

**R10.2** On app load, the frontend must call `GET /api/v1/auth/me`. If it returns 200, populate `authSlice` with the user object. If 401, treat as logged out.

**R10.3** All API calls via RTK Query must use `credentials: 'include'` so the browser sends the HTTP-Only cookie automatically.

**R10.4** Login and register API calls must be updated to point to `/api/v1/auth/login` and `/api/v1/auth/register`.

**R10.5** The frontend logout action must call `POST /api/v1/auth/logout` to clear the server-side cookie, then clear the `authSlice` state.

---

## R11 — Route Versioning

**R11.1** All new module routes must be mounted at `/api/v1/*` in `server.js`.

**R11.2** Existing `/api/auth/*`, `/api/holdings/*`, `/api/market/*`, `/api/chat/*` routes must remain mounted as-is during Phase 1 for backward compatibility. They are removed in Phase 2 once all frontend consumers are migrated.
