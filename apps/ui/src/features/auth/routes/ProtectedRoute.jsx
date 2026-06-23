import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { Spinner } from '@/shared/ui/spinner';
import { selectAuthState } from '../store/authSelectors';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
