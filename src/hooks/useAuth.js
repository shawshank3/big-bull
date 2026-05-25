/**
 * useAuth Hook
 * Custom hook for authentication operations
 */
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout as logoutAction,
} from '../store/slices/authSlice';
import { useLoginMutation, useRegisterMutation } from '../api/apiSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const { user, token, error, isAuthenticated } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    try {
      dispatch(loginStart());
      const authData = await loginMutation({ email, password }).unwrap();
      dispatch(loginSuccess(authData));
      navigate('/dashboard');
      return authData;
    } catch (err) {
      const errorMessage = err?.data?.message || err?.error || 'Login failed';
      dispatch(loginFailure(errorMessage));
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      dispatch(registerStart());
      const authData = await registerMutation(userData).unwrap();
      dispatch(registerSuccess(authData));
      navigate('/dashboard');
      return authData;
    } catch (err) {
      const errorMessage = err?.data?.message || err?.error || 'Registration failed';
      dispatch(registerFailure(errorMessage));
      throw err;
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  return {
    user,
    token,
    isLoading: isLoginLoading || isRegisterLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  };
};

export default useAuth;
