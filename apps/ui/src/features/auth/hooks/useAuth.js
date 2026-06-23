import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from '../api/authApi';
import { selectAuthState } from '../store/authSelectors';

export const useAuth = () => {
  const navigate = useNavigate();

  const [loginMutation, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading, error: registerError }] =
    useRegisterMutation();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation({
    fixedCacheKey: 'global-logout',
  });

  const { user, isAuthenticated, isLoading } = useSelector(selectAuthState);

  const login = async (email, password) => {
    const user = await loginMutation({ email, password }).unwrap();
    navigate('/dashboard');
    return user;
  };

  const register = async (userData) => {
    const user = await registerMutation(userData).unwrap();
    navigate('/dashboard');
    return user;
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // non-fatal
    } finally {
      navigate('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading || isRegisterLoading,
    isLoggingOut,
    error: loginError?.data?.error?.message || registerError?.data?.error?.message || null,
    login,
    register,
    logout,
  };
};

export default useAuth;
