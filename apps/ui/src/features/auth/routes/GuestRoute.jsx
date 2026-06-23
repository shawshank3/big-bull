/**
 * GuestRoute
 * Redirects authenticated users away from login/register pages.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectAuthState } from '../store/authSelectors';

export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  if (isLoading) return <Outlet />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
