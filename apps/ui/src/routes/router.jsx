import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { RootLayout } from '../components/layout/RootLayout';
import GuestRoute from './auth/GuestRoute';
import ProtectedRoute from './app/ProtectedRoute';
import RootRedirect from './app/RootRedirect';
import Login from './auth/Login';
import Register from './auth/Register';
import Dashboard from './dashboard/Dashboard';
import Holdings from './holdings/Holdings';
import Market from './market/Market';
import Profile from './profile/Profile';
import StockDetail from './market/StockDetail';
import MutualDetail from './market/MutualDetail';
import Explore from './explore/Explore';
import NotFound from './not-found/NotFound';

export const router = createBrowserRouter([
  // Auth pages — full-screen layout, no shared navbar
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
    ],
  },
  // All other pages share RootLayout (navbar + constrained main)
  {
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.HOLDINGS, element: <Holdings /> },
          { path: ROUTES.MARKET, element: <Market /> },
          { path: ROUTES.PROFILE, element: <Profile /> },
        ],
      },
      { path: ROUTES.EXPLORE, element: <Explore /> },
      { path: ROUTES.STOCK_DETAIL, element: <StockDetail /> },
      { path: ROUTES.MUTUAL_DETAIL, element: <MutualDetail /> },
      { path: ROUTES.ROOT, element: <RootRedirect /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
