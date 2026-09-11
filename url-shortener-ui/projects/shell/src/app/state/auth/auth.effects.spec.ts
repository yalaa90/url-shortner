import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { AuthEffects } from './auth.effects';
import { authActions } from './auth.actions';
import { AuthService, TokenResponse, UserProfile } from '../../core/services/auth.service';

describe('AuthEffects', () => {
  let actions$: ReplaySubject<Action>;
  let effects: AuthEffects;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const profile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    roles: [],
    emailVerified: true,
  };
  const tokenResponse: TokenResponse = { access_token: 'access-1' };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'logout',
      'getProfile',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    effects = TestBed.inject(AuthEffects);
  });

  it('dispatches loginSuccess with the profile after a successful login', () => {
    authService.login.and.returnValue(of(tokenResponse));
    authService.getProfile.and.returnValue(of(profile));

    let emitted: Action | undefined;
    effects.login$.subscribe((action) => (emitted = action));
    actions$.next(authActions.loginRequest({ username: 'user@example.com', password: 'secret' }));

    expect(emitted).toEqual(authActions.loginSuccess({ profile }));
  });

  it('dispatches loginFailure when the login call errors', () => {
    const error = new Error('network down');
    authService.login.and.returnValue(throwError(() => error));

    let emitted: Action | undefined;
    effects.login$.subscribe((action) => (emitted = action));
    actions$.next(authActions.loginRequest({ username: 'u', password: 'p' }));

    expect(emitted).toEqual(authActions.loginFailure(error as never));
  });

  it('navigates to the dashboard on loginSuccess', () => {
    effects.loginSuccess$.subscribe();
    actions$.next(authActions.loginSuccess({ profile }));

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('dispatches logoutSuccess after logout', () => {
    authService.logout.and.returnValue(of(undefined));

    let emitted: Action | undefined;
    effects.logout$.subscribe((action) => (emitted = action));
    actions$.next(authActions.logout());

    expect(emitted).toEqual(authActions.logoutSuccess());
  });

  it('navigates to login on logoutSuccess', () => {
    effects.logoutSuccess$.subscribe();
    actions$.next(authActions.logoutSuccess());

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('dispatches profileLoaded after loading a profile', () => {
    authService.getProfile.and.returnValue(of(profile));

    let emitted: Action | undefined;
    effects.loadProfile$.subscribe((action) => (emitted = action));
    actions$.next(authActions.loadProfile());

    expect(emitted).toEqual(authActions.profileLoaded({ profile }));
  });

  it('dispatches loginFailure when loading a profile fails', () => {
    const error = new Error('boom');
    authService.getProfile.and.returnValue(throwError(() => error));

    let emitted: Action | undefined;
    effects.loadProfile$.subscribe((action) => (emitted = action));
    actions$.next(authActions.loadProfile());

    expect(emitted).toEqual(authActions.loginFailure(error as never));
  });
});