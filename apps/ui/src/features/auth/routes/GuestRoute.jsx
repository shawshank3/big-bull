/**
 * GuestRoute
 * Redirects authenticated users away from login/register pages.
 * Renders nothing while auth status is resolving to prevent flash of guest content.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectAuthState } from '../store/authSelectors';
import { GlobalLoader } from '@/shared/layout';

export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  if (isLoading) {
    return <GlobalLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
