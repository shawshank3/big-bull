import { createSelector } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';

const selectGetMeResult = authApi.endpoints.getMe.select();

export const selectAuthState = createSelector(selectGetMeResult, (getMeResult) => {
  const { data, isLoading, isUninitialized, isSuccess, isError, error } = getMeResult;

  return {
    user: isSuccess && data ? data : null,
    isAuthenticated: isSuccess && !!data,
    isLoading: isUninitialized || isLoading,
    error: isError ? error : null,
  };
});

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (auth) => auth.isAuthenticated
);

export const selectAuthUser = createSelector(selectAuthState, (auth) => auth.user);

export const selectAuthIsLoading = createSelector(selectAuthState, (auth) => auth.isLoading);
