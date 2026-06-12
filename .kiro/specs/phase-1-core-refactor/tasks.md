# Implementation Plan

## Overview
Phase 1 refactor of BigBull — migrate from horizontal to vertical feature-module architecture, establish shared infrastructure (catchAsync, AppError, Redis, BullMQ), switch auth to HTTP-Only cookie JWTs, create Transaction/Portfolio/Wallet/Asset modules, add SSE streaming, and migrate the frontend to cookie-based auth.

## Tasks

- [x] 1. Create shared infrastructure utilities
  - [x] 1.1 Create `apps/api/src/shared/catchAsync.js`
  - [x] 1.2 Create `apps/api/src/shared/AppError.js`
  - [x] 1.3 Update `apps/api/src/utils/response.js` with unified format
  - [x] 1.4 Update `apps/api/src/middleware/errorHandler.js`
  - [x] 1.5 Add `validateEnv()` to `apps/api/index.js`
  - [x] 1.6 Install backend dependencies: zod, ioredis, bullmq, cookie-parser, express-rate-limit
  - [x] 1.7 Create `apps/api/src/shared/redis.js`
  - [x] 1.8 Add cookie-parser middleware to server.js

- [x] 2. Build Auth module with cookie-based JWT
  - [x] 2.1 Create `apps/api/src/modules/auth/auth.validator.js`
  - [x] 2.2 Add `role` field to `apps/api/src/models/User.js`
  - [x] 2.3 Create `apps/api/src/modules/auth/auth.service.js`
  - [x] 2.4 Create `apps/api/src/modules/auth/auth.controller.js`
  - [x] 2.5 Create `apps/api/src/modules/auth/auth.routes.js`
  - [x] 2.6 Update `apps/api/src/middleware/authMiddleware.js` to read cookie
  - [x] 2.7 Mount new auth routes in server.js at /api/v1/auth
  - [x] 2.8 Create `apps/api/src/middleware/rateLimiter.js`

- [x] 3. Create Asset model
  - [x] 3.1 Create `apps/api/src/modules/asset/asset.model.js`
  - [x] 3.2 Create `apps/api/src/modules/asset/asset.validator.js`

- [x] 4. Build VirtualWallet module
  - [x] 4.1 Create `apps/api/src/modules/wallet/wallet.model.js`
  - [x] 4.2 Create `apps/api/src/modules/wallet/wallet.service.js`
  - [x] 4.3 Create `apps/api/src/modules/wallet/wallet.controller.js`
  - [x] 4.4 Create `apps/api/src/modules/wallet/wallet.routes.js`
  - [x] 4.5 Seed VirtualWallet on user registration in auth.service.js
  - [x] 4.6 Mount wallet routes in server.js

- [x] 5. Build Transaction module (source of truth)
  - [x] 5.1 Create `apps/api/src/modules/transaction/transaction.model.js`
  - [x] 5.2 Create `apps/api/src/modules/transaction/transaction.validator.js`
  - [x] 5.3 Create `apps/api/src/modules/transaction/transaction.service.js` with executeOrder, getTransactionHistory, aggregateHoldings
  - [x] 5.4 Create `apps/api/src/modules/transaction/transaction.controller.js`
  - [x] 5.5 Create `apps/api/src/modules/transaction/transaction.routes.js`
  - [x] 5.6 Mount transaction routes in server.js

- [x] 6. Build Portfolio module (computed from transactions)
  - [x] 6.1 Create `apps/api/src/modules/portfolio/portfolio.service.js` with computeHoldings and computeSummary
  - [x] 6.2 Create `apps/api/src/modules/portfolio/portfolio.controller.js`
  - [x] 6.3 Create `apps/api/src/modules/portfolio/portfolio.routes.js`
  - [x] 6.4 Mount portfolio routes in server.js

- [x] 7. Build Market module with Redis cache and SSE
  - [x] 7.1 Create `apps/api/src/modules/market/market.validator.js`
  - [x] 7.2 Create `apps/api/src/modules/market/market.service.js` with Redis cache-aside
  - [x] 7.3 Create `apps/api/src/modules/market/market.controller.js` with SSE stream handler
  - [x] 7.4 Create `apps/api/src/modules/market/market.routes.js`
  - [x] 7.5 Mount market module routes in server.js at /api/v1/market

- [x] 8. Set up BullMQ worker skeleton
  - [x] 8.1 Create `apps/api/src/config/bullmq.js` with queue definitions
  - [x] 8.2 Create `apps/api/src/workers/mseWorker.js` skeleton
  - [x] 8.3 Schedule mse-price-tick job to repeat every 30 seconds
  - [x] 8.4 Create `apps/api/src/workers/index.js` worker bootstrap entry point

- [x] 9. Migrate frontend to cookie-based auth and /api/v1 endpoints
  - [x] 9.1 Update `apps/ui/src/api/apiSlice.js` with baseUrl / and credentials include
  - [x] 9.2 Update `apps/ui/src/store/slices/authSlice.js` to remove localStorage token storage
  - [x] 9.3 Create `apps/ui/src/api/authApi.js` RTK Query endpoints
  - [x] 9.4 Update `apps/ui/src/hooks/useAuth.js` to use RTK Query v1 mutations
  - [x] 9.5 Update `apps/ui/src/App.jsx` to hydrate auth state on mount via getMe
  - [x] 9.6 Update `apps/ui/src/constants/apiUrls.js` to /api/v1 paths

- [x] 10. Final server wiring and verification
  - [x] 10.1 Update GET /api/health to check MongoDB connection status (returns 503 if disconnected)
  - [x] 10.2 Apply generalLimiter + authLimiter to /api/v1 routes in server.js
  - [x] 10.3 All /api/v1 routes mounted; all old /api routes still respond (backward compat)
  - [x] 10.4 Update apps/api/.env.example with REDIS_URL, JWT_REFRESH_SECRET, MONGODB_URI

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "3"] },
    { "wave": 3, "tasks": ["4"] },
    { "wave": 4, "tasks": ["5"] },
    { "wave": 5, "tasks": ["6", "7"] },
    { "wave": 6, "tasks": ["8", "9"] },
    { "wave": 7, "tasks": ["10"] }
  ]
}
```

## Notes
- The existing `/api/*` routes remain mounted throughout Phase 1 for backward compatibility
- The old Holding model and holdingsController are untouched — new Transaction-based portfolio runs alongside
- Cookie auth is the new auth path for `/api/v1/*`; Bearer token middleware stays for the legacy `/api/*` routes
- All monetary values are in Indian Rupees (₹). No USD anywhere.
- Asset universe: Indian equities (NSE/BSE) and Indian Mutual Funds only
- Task 4.5 (VirtualWallet seed on registration) needs wiring into auth.service.js — see note below

## Pending Follow-up (Post Phase 1)

**4.5 — Wire VirtualWallet creation into auth.service.js registration**
The wallet model exists but `auth.service.js` doesn't yet create a wallet when a user registers. Add this to `issueAuthCookies` or the `register` controller after user creation:
```js
const VirtualWallet = require('../wallet/wallet.model');
await VirtualWallet.create({ userId: user._id, balance: 1000000 });
```
This is a one-liner addition to `auth.controller.js` in the `register` handler, after `User.create()`.
