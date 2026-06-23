import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '@/shared/api/apiSlice';

import '@/features/auth/api/authApi';
import '@/features/user/api/userApi';
import '@/features/market/api/marketApi';
import '@/features/portfolio/api/portfolioApi';
import '@/features/wallet/api/walletApi';
import '@/features/transaction/api/transactionApi';
import '@/features/chat/api/chatApi';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store;
