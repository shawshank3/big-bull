import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { RootLayout } from '@/shared/layout/RootLayout';
import { RouteErrorBoundary } from '@/shared/errors/RouteErrorBoundary';
import { GuestRoute } from '@/features/auth/routes/GuestRoute';
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute';
import { RootRedirect } from '@/features/auth/routes/RootRedirect';
import { Login } from '@/features/auth/routes/Login';
import { Register } from '@/features/auth/routes/Register';
import { Dashboard } from '@/features/portfolio/routes/Dashboard';
import { Holdings } from '@/features/portfolio/routes/Holdings';
import { Market } from '@/features/market/routes/Market';
import { StockDetail } from '@/features/market/routes/StockDetail';
import { MutualDetail } from '@/features/market/routes/MutualDetail';
import { Search } from '@/features/market/routes/Search';
import { Profile } from '@/features/user/routes/Profile';
import { Wallet } from '@/features/wallet/routes/Wallet';
import { Explore } from '@/features/explore/Explore';
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
