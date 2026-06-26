import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectAuthState } from '../store/authSelectors';
import { GlobalLoader } from '@/shared/layout';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  if (isLoading) {
    return <GlobalLoader />;
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
