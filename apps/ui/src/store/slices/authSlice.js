/**
 * Auth Slice
 * Redux slice for authentication state management
 */
import { createSlice } from '@reduxjs/toolkit';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/utils';

const initialState = {
  user: getFromLocalStorage('user'),
  token: getFromLocalStorage('token'),
  refreshToken: getFromLocalStorage('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!getFromLocalStorage('token'),
};

const persistAuth = (state) => {
  saveToLocalStorage('user', state.user);
  saveToLocalStorage('token', state.token);
  saveToLocalStorage('refreshToken', state.refreshToken);
};

const clearAuth = (state) => {
  state.user = null;
  state.token = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.error = null;
  removeFromLocalStorage('user');
  removeFromLocalStorage('token');
  removeFromLocalStorage('refreshToken');
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      persistAuth(state);
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },

    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      persistAuth(state);
    },
    registerFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    tokenRefreshed: (state, action) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      state.isAuthenticated = true;
      persistAuth(state);
    },

    logout: (state) => {
      clearAuth(state);
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  tokenRefreshed,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
