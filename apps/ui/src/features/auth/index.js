// Auth feature public API
export { AuthProvider } from './providers/AuthProvider';
export { GuestRoute } from './routes/GuestRoute';
export { ProtectedRoute } from './routes/ProtectedRoute';
export { RootRedirect } from './routes/RootRedirect';
export { Login } from './routes/Login';
export { Register } from './routes/Register';
export { useAuth } from './hooks/useAuth';
export {
  authApi,
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} from './api/authApi';
export {
  setUser,
  clearUser,
  setLoading,
  clearError,
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  tokenRefreshed,
  logout,
} from './store/authSlice';
export { default as authReducer } from './store/authSlice';
