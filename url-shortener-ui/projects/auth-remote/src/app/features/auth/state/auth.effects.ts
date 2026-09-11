import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { exhaustMap, map, catchError, tap, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loginRequest),
      exhaustMap(({ username, password }) =>
        this.authService.login(username, password).pipe(
          mergeMap(() => this.authService.getProfile()),
          map((profile) => authActions.loginSuccess({ profile })),
          catchError((error) => of(authActions.loginFailure(error)))
        )
      )
    )
  );

  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.loginSuccess),
        tap(() => this.router.navigate(['/dashboard']))
      ),
    { dispatch: false }
  );

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => authActions.logoutSuccess())
        )
      )
    )
  );

  readonly logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.logoutSuccess),
        tap(() => this.router.navigate(['/auth/login']))
      ),
    { dispatch: false }
  );

  readonly loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loadProfile),
      exhaustMap(() =>
        this.authService.getProfile().pipe(
          map((profile) => authActions.profileLoaded({ profile })),
          catchError((error) => of(authActions.loginFailure(error)))
        )
      )
    )
  );
}
