import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { authGuard, guestGuard } from './auth.guard';
import { AuthState } from '../../state/auth/auth.reducer';
import { AppState } from '../../state/app.state';

describe('guards', () => {
  let store: MockStore<AppState>;
  let router: jasmine.SpyObj<Router>;

  function withAuthState(state: AuthState): void {
    store.setState({ auth: state, links: { entities: {}, ids: [], loading: false, error: null, nextCursor: undefined, hasMore: false, creating: false, optimisticCodes: [] } });
  }

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    TestBed.configureTestingModule({
      providers: [
        provideMockStore<AppState>(),
        { provide: Router, useValue: router },
      ],
    });
    store = TestBed.inject(MockStore<AppState>);
  });

  describe('authGuard', () => {
    it('allows access when authenticated', async () => {
      withAuthState({ user: null, isAuthenticated: true, loading: false, error: null });
      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          authGuard({} as never, {} as never)
        ) as Observable<boolean | UrlTree>
      );
      expect(result).toBeTrue();
    });

    it('redirects to the login page when not authenticated', async () => {
      withAuthState({ user: null, isAuthenticated: false, loading: false, error: null });
      const tree = { toString: () => '/auth/login' } as unknown as UrlTree;
      router.createUrlTree.and.returnValue(tree);

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          authGuard({} as never, {} as never)
        ) as Observable<boolean | UrlTree>
      );
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('guestGuard', () => {
    it('allows access when not authenticated', async () => {
      withAuthState({ user: null, isAuthenticated: false, loading: false, error: null });
      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          guestGuard({} as never, {} as never)
        ) as Observable<boolean | UrlTree>
      );
      expect(result).toBeTrue();
    });

    it('redirects to the dashboard when already authenticated', async () => {
      withAuthState({ user: null, isAuthenticated: true, loading: false, error: null });
      const tree = { toString: () => '/dashboard' } as unknown as UrlTree;
      router.createUrlTree.and.returnValue(tree);

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          guestGuard({} as never, {} as never)
        ) as Observable<boolean | UrlTree>
      );
      expect(result).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});