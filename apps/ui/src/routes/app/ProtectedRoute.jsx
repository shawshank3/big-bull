/**
 * Redirects unauthenticated users to login.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
