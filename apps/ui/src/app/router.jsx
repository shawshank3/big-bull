import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { RootLayout } from '@/shared/layout/RootLayout';
import { RouteErrorBoundary } from '@/shared/errors/RouteErrorBoundary';
import { GuestRoute, ProtectedRoute, RootRedirect, Login, Register } from '@/features/auth';
import { Dashboard, Holdings } from '@/features/portfolio';
import { Market, StockDetail, MutualDetail, Search } from '@/features/market';
import { Profile } from '@/features/user';
import { Wallet } from '@/features/wallet';
import { Explore } from '@/features/explore';
import { TaxCenter, TaxHarvesting } from '@/features/tax';
import NotFound from './routes/NotFound';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
    ],
  },
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.HOLDINGS, element: <Holdings /> },
          { path: ROUTES.PROFILE, element: <Profile /> },
          { path: ROUTES.WALLET, element: <Wallet /> },
          { path: ROUTES.TAX, element: <TaxCenter /> },
          { path: ROUTES.TAX_HARVESTING, element: <TaxHarvesting /> },
        ],
      },
      { path: ROUTES.MARKET, element: <Market /> },
      { path: ROUTES.SEARCH, element: <Search /> },
      { path: ROUTES.EXPLORE, element: <Explore /> },
      { path: ROUTES.STOCK_DETAIL, element: <StockDetail /> },
      { path: ROUTES.MUTUAL_DETAIL, element: <MutualDetail /> },
      { path: ROUTES.ROOT, element: <RootRedirect /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
