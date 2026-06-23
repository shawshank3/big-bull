/**
 * RootRedirect
 * Sends `/` to dashboard or explore based on auth state.
 */
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectIsAuthenticated } from '../store/authSelectors';

export const RootRedirect = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.EXPLORE} replace />;
};

export default RootRedirect;
