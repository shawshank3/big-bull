/**
 * RootRedirect
 * Waits for auth hydration, then sends `/` to dashboard or explore.
 */
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectAuthState } from '../store/authSelectors';
import { GlobalLoader } from '@/shared/layout';

export const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useSelector(selectAuthState);

  if (isLoading) return <GlobalLoader label="Finding your runway..." />;

  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.EXPLORE} replace />;
};

export default RootRedirect;
