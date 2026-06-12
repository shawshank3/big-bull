/**
 * Store Configuration
 * Redux store setup with all slices
 */
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer, {
  clearUser,
  loginSuccess,
  logout,
  registerSuccess,
} from './slices/authSlice';
import { apiSlice } from '../api/apiSlice';

const listenerMiddleware = createListenerMiddleware();

// Reset all RTK Query cache on auth state changes
// clearUser is dispatched by useAuth.logout() — the actual logout flow
// logout/loginSuccess/registerSuccess are backup triggers for any direct slice actions
listenerMiddleware.startListening({
  matcher: (action) =>
    clearUser.match(action) ||
    logout.match(action) ||
    loginSuccess.match(action) ||
    registerSuccess.match(action),
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(apiSlice.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(listenerMiddleware.middleware)
      .concat(apiSlice.middleware),
});

export default store;
