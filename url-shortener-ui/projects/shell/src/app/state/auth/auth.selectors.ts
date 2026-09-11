import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectAccessToken = createSelector(
  selectAuthState,
  () => localStorage.getItem('urlshortener_access_token')
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectHasRole = (role: string) =>
  createSelector(selectCurrentUser, (user) => user?.roles?.includes(role) ?? false);