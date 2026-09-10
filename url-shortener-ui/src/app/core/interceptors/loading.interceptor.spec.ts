import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { loadingInterceptor, loadingState$ } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    loadingState$.next(0);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    loadingState$.next(0);
    httpMock.verify();
  });

  it('increments the counter while requests are in flight and decrements on completion', () => {
    http.get('/api/v1/links').subscribe();
    expect(loadingState$.value).toBe(1);

    http.get('/api/v1/analytics/abc').subscribe();
    expect(loadingState$.value).toBe(2);

    httpMock.expectOne('/api/v1/links').flush({});
    expect(loadingState$.value).toBe(1);

    httpMock.expectOne('/api/v1/analytics/abc').flush({});
    expect(loadingState$.value).toBe(0);
  });

  it('returns to an idle counter after a completed request', () => {
    http.get('/api/v1/links').subscribe();
    httpMock.expectOne('/api/v1/links').flush({});
    expect(loadingState$.value).toBe(0);
  });
});