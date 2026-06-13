/**
 * useAuth Hook
 * Cookie-based auth — no token stored client-side.
 * JWT lives in an HTTP-Only cookie managed by the server.
 */
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setUser,
  clearUser,
  loginStart,
  loginFailure,
  registerStart,
  registerFailure,
} from '../store/slices/authSlice';
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from '../api/authApi';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    try {
      dispatch(loginStart());
      const user = await loginMutation({ email, password }).unwrap();
      dispatch(setUser(user));
      navigate('/dashboard');
      return user;
    } catch (err) {
      const message = err?.data?.error?.message || err?.data?.message || 'Login failed';
      dispatch(loginFailure(message));
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      dispatch(registerStart());
      const user = await registerMutation(userData).unwrap();
      dispatch(setUser(user));
      navigate('/dashboard');
      return user;
    } catch (err) {
      const message = err?.data?.error?.message || err?.data?.message || 'Registration failed';
      dispatch(registerFailure(message));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Server error is non-fatal — clear client state regardless
    } finally {
      dispatch(clearUser());
      navigate('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading || isRegisterLoading,
    error,
    login,
    register,
    logout,
  };
};

export default useAuth;
