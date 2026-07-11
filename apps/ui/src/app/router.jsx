import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { RootLayout } from '@/shared/layout/RootLayout';
import { RouteErrorBoundary } from '@/shared/errors/RouteErrorBoundary';
import { GuestRoute, ProtectedRoute, RootRedirect, Login, Register } from '@/features/auth';
import NotFound from './routes/NotFound';

// ─── Route-level lazy loading ─────────────────────────────────────────────────
//
// React Router v6.9+ `route.lazy()` is the correct mechanism for route/page
// code splitting. It runs before rendering, integrates with the navigation
// lifecycle, and does NOT require a manual <Suspense> boundary — RR handles the
// pending state internally (via startTransition).
//
// Rules:
//  • route.lazy() → page-level components (routes)
//  • React.lazy() + <Suspense> → heavy intra-page components only
//    (e.g. AI chat panel, modals, rich editors loaded on user interaction)
//
// Each lazy() fn must return { Component } (or other route properties).
// Named exports from feature barrels are mapped here; default-export-only
// modules (like Disclaimer) resolve automatically via `default`.
//
// Eager routes (no lazy()):
//  • RootLayout, GuestRoute, ProtectedRoute — layout/guard elements
//  • Login, Register — small, always needed on the auth flow entry point
//  • RootRedirect, NotFound — tiny, no meaningful split benefit
// ─────────────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Guest-only routes (login / register) ──────────────────────────────────
  {
    element: <GuestRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
    ],
  },

  // ── RootLayout shell — all app pages live here ────────────────────────────
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // ── Protected routes (auth required) ──────────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            lazy: () => import('@/features/portfolio').then((m) => ({ Component: m.Dashboard })),
          },
          {
            path: ROUTES.HOLDINGS,
            lazy: () => import('@/features/portfolio').then((m) => ({ Component: m.Holdings })),
          },
          {
            path: ROUTES.PROFILE,
            lazy: () => import('@/features/user').then((m) => ({ Component: m.Profile })),
          },
          {
            path: ROUTES.WALLET,
            lazy: () => import('@/features/wallet').then((m) => ({ Component: m.Wallet })),
          },
          {
            path: ROUTES.TAX,
            lazy: () => import('@/features/tax').then((m) => ({ Component: m.TaxCenter })),
          },
          {
            path: ROUTES.TAX_HARVESTING,
            lazy: () => import('@/features/tax').then((m) => ({ Component: m.TaxHarvesting })),
          },
        ],
      },

      // ── Public routes ──────────────────────────────────────────────────────
      {
        path: ROUTES.MARKET,
        lazy: () => import('@/features/market').then((m) => ({ Component: m.Market })),
      },
      {
        path: ROUTES.SEARCH,
        lazy: () => import('@/features/market').then((m) => ({ Component: m.Search })),
      },
      {
        path: ROUTES.EXPLORE,
        lazy: () => import('@/features/explore').then((m) => ({ Component: m.Explore })),
      },
      {
        path: ROUTES.STOCK_DETAIL,
        lazy: () => import('@/features/market').then((m) => ({ Component: m.StockDetail })),
      },
      {
        path: ROUTES.MUTUAL_DETAIL,
        lazy: () => import('@/features/market').then((m) => ({ Component: m.MutualDetail })),
      },
      {
        path: ROUTES.DISCLAIMER,
        lazy: () => import('./routes/Disclaimer').then((m) => ({ Component: m.Disclaimer })),
      },

      // ── Utility routes ─────────────────────────────────────────────────────
      { path: ROUTES.ROOT, element: <RootRedirect /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
