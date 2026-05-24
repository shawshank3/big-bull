/**
 * Auth Slice
 * Redux slice for authentication state management
 */
import { createSlice } from '@reduxjs/toolkit';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '../../utils/localStorage';

const initialState = {
  user: getFromLocalStorage('user'),
  token: getFromLocalStorage('token'),
  isLoading: false,
  error: null,
  isAuthenticated: !!getFromLocalStorage('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      saveToLocalStorage('user', user);
      saveToLocalStorage('token', token);
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },

    // Register
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      saveToLocalStorage('user', user);
      saveToLocalStorage('token', token);
    },
    registerFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      removeFromLocalStorage('user');
      removeFromLocalStorage('token');
    },

    // Clear Error
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
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
