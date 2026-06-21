/**
 * Auth Slice
 * Cookie-based auth — no tokens stored in localStorage or Redux state.
 * Auth state is hydrated by calling GET /api/v1/auth/me on app load.
 */
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true, // true until getMe hydration completes on app load
    isLoggingOut: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isLoggingOut = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isLoggingOut = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLoggingOut: (state, action) => {
      state.isLoggingOut = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Backward-compat aliases kept so existing components don't break
    loginSuccess: (state, action) => {
      state.user = action.payload?.user ?? action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isLoggingOut = false;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.user = action.payload?.user ?? action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isLoggingOut = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isLoggingOut = false;
      state.error = null;
    },
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    registerStart: (state) => {
      state.isLoading = true;
    },
    registerFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    tokenRefreshed: (state) => {
      /* cookies handled server-side — no-op */
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setLoggingOut,
  clearError,
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  tokenRefreshed,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
