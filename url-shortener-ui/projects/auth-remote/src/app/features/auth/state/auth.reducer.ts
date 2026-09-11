import { createReducer, on } from '@ngrx/store';
import { authActions, UserProfile } from './auth.actions';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: unknown;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,
  on(authActions.loginRequest, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(authActions.loginSuccess, (state, { profile }): AuthState => ({
    ...state,
    user: profile,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),
  on(authActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),
  on(authActions.logout, (state): AuthState => ({ ...state, loading: true })),
  on(authActions.logoutSuccess, (): AuthState => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  })),
  on(authActions.profileLoaded, (state, { profile }): AuthState => ({
    ...state,
    user: profile,
    isAuthenticated: true,
    loading: false,
  }))
);
