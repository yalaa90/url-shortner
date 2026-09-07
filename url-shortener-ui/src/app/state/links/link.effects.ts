import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, exhaustMap, map, of, tap, mergeMap } from 'rxjs';
import { LinkApiService } from '../../core/services/link-api.service';
import { linkActions } from './link.actions';
import { Router } from '@angular/router';

@Injectable()
export class LinkEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly linkApi: LinkApiService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  readonly loadLinks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(linkActions.loadLinks),
      exhaustMap(({ page, size }) =>
        this.linkApi.getUserLinks(page, size).pipe(
          mergeMap((response) =>
            this.linkApi.getUserLinksCursor(undefined, size).pipe(
              map((cursorResponse) =>
                linkActions.loadLinksSuccess({
                  links: response.data.content.length
                    ? response.data.content
                    : cursorResponse.data.data,
                  page: response.data,
                  cursorPage: cursorResponse.data,
                })
              )
            )
          ),
          catchError((error) => of(linkActions.loadLinksFailure({ error })))
        )
      )
    )
  );

  readonly createLink$ = createEffect(() =>
    this.actions$.pipe(
      ofType(linkActions.createLink),
      exhaustMap(({ payload }) =>
        this.linkApi.createLink(payload).pipe(
          map((response) => linkActions.createLinkSuccess({ link: response.data })),
          tap(() =>
            this.snackBar.open('Link created', 'Dismiss', { duration: 3000 })
          ),
          catchError((error) => of(linkActions.createLinkFailure({ error })))
        )
      )
    )
  );

  readonly deactivateLink$ = createEffect(() =>
    this.actions$.pipe(
      ofType(linkActions.deactivateLink),
      exhaustMap(({ code }) =>
        this.linkApi.deactivateLink(code).pipe(
          map(() => linkActions.deactivateLinkSuccess({ code })),
          tap(() =>
            this.snackBar.open('Link deactivated', 'Dismiss', { duration: 3000 })
          ),
          catchError((error) => of(linkActions.deactivateLinkFailure({ error })))
        )
      )
    )
  );
}