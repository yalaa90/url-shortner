import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplaySubject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { LinkEffects } from './link.effects';
import { linkActions } from './link.actions';
import { LinkApiService } from '../../core/services/link-api.service';
import { ApiResponse, Page, ShortLink } from '../../shared/models/link.model';

describe('LinkEffects', () => {
  let actions$: ReplaySubject<Action>;
  let effects: LinkEffects;
  let linkApi: jasmine.SpyObj<LinkApiService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const link: ShortLink = {
    id: 1,
    shortCode: 'abc',
    shortUrl: 'http://localhost/s/abc',
    originalUrl: 'https://example.com',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 3,
  };
  const page: Page<ShortLink> = {
    content: [link],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    linkApi = jasmine.createSpyObj<LinkApiService>('LinkApiService', [
      'getUserLinks',
      'createLink',
      'deactivateLink',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        LinkEffects,
        provideMockActions(() => actions$),
        { provide: LinkApiService, useValue: linkApi },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    effects = TestBed.inject(LinkEffects);
  });

  it('dispatches loadLinksSuccess with links and page metadata', () => {
    const response: ApiResponse<Page<ShortLink>> = { success: true, data: page };
    linkApi.getUserLinks.and.returnValue(of(response));

    let emitted: Action | undefined;
    effects.loadLinks$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.loadLinks({ page: 0, size: 20 }));

    expect(emitted).toEqual(linkActions.loadLinksSuccess({ links: [link], page }));
    expect(linkApi.getUserLinks).toHaveBeenCalledWith(0, 20);
  });

  it('dispatches loadLinksFailure on an error', () => {
    const error = new Error('boom');
    linkApi.getUserLinks.and.returnValue(throwError(() => error));

    let emitted: Action | undefined;
    effects.loadLinks$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.loadLinks({}));

    expect(emitted).toEqual(linkActions.loadLinksFailure({ error }));
  });

  it('dispatches createLinkSuccess and notifies on creation', () => {
    const response: ApiResponse<ShortLink> = { success: true, data: link };
    linkApi.createLink.and.returnValue(of(response));

    let emitted: Action | undefined;
    effects.createLink$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.createLink({ payload: { url: 'https://example.com' } }));

    expect(emitted).toEqual(linkActions.createLinkSuccess({ link }));
    expect(snackBar.open).toHaveBeenCalledWith('Link created', 'Dismiss', { duration: 3000 });
  });

  it('dispatches createLinkFailure on an error', () => {
    const error = new Error('boom');
    linkApi.createLink.and.returnValue(throwError(() => error));

    let emitted: Action | undefined;
    effects.createLink$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.createLink({ payload: { url: 'https://example.com' } }));

    expect(emitted).toEqual(linkActions.createLinkFailure({ error }));
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('dispatches deactivateLinkSuccess and notifies', () => {
    linkApi.deactivateLink.and.returnValue(of({ success: true, data: undefined }));

    let emitted: Action | undefined;
    effects.deactivateLink$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.deactivateLink({ code: 'abc' }));

    expect(emitted).toEqual(linkActions.deactivateLinkSuccess({ code: 'abc' }));
    expect(snackBar.open).toHaveBeenCalledWith('Link deactivated', 'Dismiss', { duration: 3000 });
  });

  it('dispatches deactivateLinkFailure on an error', () => {
    const error = new Error('boom');
    linkApi.deactivateLink.and.returnValue(throwError(() => error));

    let emitted: Action | undefined;
    effects.deactivateLink$.subscribe((action) => (emitted = action));
    actions$.next(linkActions.deactivateLink({ code: 'abc' }));

    expect(emitted).toEqual(linkActions.deactivateLinkFailure({ error }));
  });
});