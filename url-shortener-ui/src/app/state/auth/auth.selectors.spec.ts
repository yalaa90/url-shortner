import {
  selectAccessToken,
  selectAuthError,
  selectAuthLoading,
  selectCurrentUser,
  selectHasRole,
  selectIsAuthenticated,
} from './auth.selectors';
import { AuthState } from './auth.reducer';
import { UserProfile } from '../../core/services/auth.service';

describe('auth selectors', () => {
  const profile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    roles: ['user', 'admin'],
    emailVerified: true,
  };

  const state: AuthState = {
    user: profile,
    isAuthenticated: true,
    loading: true,
    error: 'nope',
  };

  it('selects the authenticated flag', () => {
    expect(selectIsAuthenticated.projector(state)).toBeTrue();
  });

  it('selects the current user', () => {
    expect(selectCurrentUser.projector(state)).toEqual(profile);
  });

  it('selects the access token from localStorage', () => {
    localStorage.setItem('urlshortener_access_token', 'token-xyz');
    expect(selectAccessToken.projector({ ...state })).toBe('token-xyz');
    localStorage.removeItem('urlshortener_access_token');
    expect(selectAccessToken.projector({ ...state })).toBeNull();
  });

  it('selects the loading flag', () => {
    expect(selectAuthLoading.projector(state)).toBeTrue();
  });

  it('selects the error', () => {
    expect(selectAuthError.projector(state)).toBe('nope');
  });

  it('checks roles against the current user', () => {
    expect(selectHasRole('admin').projector(profile)).toBeTrue();
    expect(selectHasRole('guest').projector(profile)).toBeFalse();
    expect(selectHasRole('guest').projector(null)).toBeFalse();
  });
});