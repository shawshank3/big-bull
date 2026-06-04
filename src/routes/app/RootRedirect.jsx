/**
 * Sends `/` to dashboard or login based on auth state.
 */
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

export const RootRedirect = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.EXPLORE} replace />;
};

export default RootRedirect;
