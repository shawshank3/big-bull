import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import HoldingsPage from '../pages/HoldingsPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => (
  <Routes>
    <Route
      path={ROUTES.LOGIN}
      element={
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      }
    />
    <Route
      path={ROUTES.REGISTER}
      element={
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      }
    />

    <Route
      path={ROUTES.DASHBOARD}
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.HOLDINGS}
      element={
        <ProtectedRoute>
          <HoldingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PROFILE}
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />

    <Route path={ROUTES.ROOT} element={<RootRedirect />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
