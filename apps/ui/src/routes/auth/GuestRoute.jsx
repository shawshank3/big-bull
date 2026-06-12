/**
 * GuestRoute
 * Redirects authenticated users away from login/register pages.
 * Waits for auth hydration before making a decision.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Still hydrating — render the form so it's visible immediately,
  // and let the redirect happen naturally once hydration settles.
  if (isLoading) return <Outlet />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
