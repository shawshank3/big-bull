/**
 * Store Configuration
 * Redux store setup with all slices
 */
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer, {
  loginSuccess,
  logout,
  registerSuccess,
} from './slices/authSlice';
import { apiSlice } from '../api/apiSlice';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: (action) =>
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
