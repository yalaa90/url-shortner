import { authActions } from './auth.actions';
import { authReducer, AuthState, initialAuthState } from './auth.reducer';
import { UserProfile } from '../../core/services/auth.service';

describe('authReducer', () => {
  const profile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    roles: ['admin'],
    emailVerified: true,
  };

  it('starts with the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialAuthState);
  });

  it('sets loading on loginRequest', () => {
    const state = authReducer(initialAuthState, authActions.loginRequest({ username: 'u', password: 'p' }));
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('stores the profile and authenticates on loginSuccess', () => {
    const state = authReducer(initialAuthState, authActions.loginSuccess({ profile }));
    expect(state.user).toEqual(profile);
    expect(state.isAuthenticated).toBeTrue();
    expect(state.loading).toBeFalse();
  });

  it('stores the error on loginFailure', () => {
    const state = authReducer(initialAuthState, authActions.loginFailure({ error: 'bad credentials' }));
    expect(state.loading).toBeFalse();
    expect(state.error).toBe('bad credentials');
  });

  it('sets loading on logout', () => {
    const prior: AuthState = { user: profile, isAuthenticated: true, loading: false, error: null };
    const state = authReducer(prior, authActions.logout());
    expect(state.loading).toBeTrue();
  });

  it('resets the session on logoutSuccess', () => {
    const prior: AuthState = { user: profile, isAuthenticated: true, loading: true, error: null };
    expect(authReducer(prior, authActions.logoutSuccess())).toEqual(initialAuthState);
  });

  it('loads a profile into the session', () => {
    const state = authReducer(initialAuthState, authActions.profileLoaded({ profile }));
    expect(state.user).toEqual(profile);
    expect(state.isAuthenticated).toBeTrue();
    expect(state.loading).toBeFalse();
  });
});