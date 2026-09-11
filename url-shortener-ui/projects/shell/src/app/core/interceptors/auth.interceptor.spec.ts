import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { selectAccessToken } from '../../state/auth/auth.selectors';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [{ selector: selectAccessToken, value: 'token-123' }],
        }),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches the bearer token to API requests', () => {
    http.get('/api/v1/links').subscribe();
    const req = httpMock.expectOne('/api/v1/links');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('skips token requests', () => {
    http
      .post('/api/v1/auth/token', 'grant_type=password', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .subscribe();
    const req = httpMock.expectOne('/api/v1/auth/token');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ access_token: 'x' });
  });

  it('sends the request unchanged when no token is available', () => {
    store.overrideSelector(selectAccessToken, null);
    store.refreshState();

    http.get('/api/v1/links/me').subscribe();
    const req = httpMock.expectOne('/api/v1/links/me');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});