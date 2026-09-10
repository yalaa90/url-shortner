import { authActions } from './auth.actions';
import { UserProfile } from '../../core/services/auth.service';

describe('authActions', () => {
  const profile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    roles: [],
    emailVerified: true,
  };

  it('creates a loginRequest action', () => {
    const action = authActions.loginRequest({ username: 'u', password: 'p' });
    expect(action.type).toBe('[Auth] loginRequest');
    expect(action.username).toBe('u');
    expect(action.password).toBe('p');
  });

  it('creates a loginSuccess action', () => {
    const action = authActions.loginSuccess({ profile });
    expect(action.type).toBe('[Auth] loginSuccess');
    expect(action.profile).toEqual(profile);
  });

  it('creates a loginFailure action', () => {
    const action = authActions.loginFailure({ error: 'boom' });
    expect(action.type).toBe('[Auth] loginFailure');
    expect(action.error).toBe('boom');
  });

  it('creates logout and logoutSuccess actions', () => {
    expect(authActions.logout().type).toBe('[Auth] logout');
    expect(authActions.logoutSuccess().type).toBe('[Auth] logoutSuccess');
  });

  it('creates loadProfile and profileLoaded actions', () => {
    expect(authActions.loadProfile().type).toBe('[Auth] loadProfile');
    const action = authActions.profileLoaded({ profile });
    expect(action.type).toBe('[Auth] profileLoaded');
    expect(action.profile).toEqual(profile);
  });
});