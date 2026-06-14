/**
 * Redux store — feature-module architecture.
 * Auth reducer lives in features/auth; API slice in shared/api.
 */
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer, {
  clearUser,
  loginSuccess,
  logout,
  registerSuccess,
} from '@/features/auth/store/authSlice';
import { apiSlice } from '@/shared/api/apiSlice';

// Import all feature API slices so their endpoints are registered before
// the store is created. The injected endpoints are side-effects on apiSlice.
import '@/features/auth/api/authApi';
import '@/features/user/api/userApi';
import '@/features/market/api/marketApi';
import '@/features/portfolio/api/portfolioApi';
import '@/features/wallet/api/walletApi';
import '@/features/transaction/api/transactionApi';
import '@/features/chat/api/chatApi';

const listenerMiddleware = createListenerMiddleware();

// Reset all RTK Query cache on auth state changes
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
    getDefaultMiddleware().concat(listenerMiddleware.middleware).concat(apiSlice.middleware),
});

export default store;
