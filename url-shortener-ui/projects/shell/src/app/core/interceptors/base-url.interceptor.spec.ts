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
import { baseUrlInterceptor } from './base-url.interceptor';

describe('baseUrlInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('prepends the configured API base URL to relative paths', () => {
    http.get('/api/v1/links').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/v1/links');
    expect(req.request.url.startsWith('http://localhost:8080')).toBeTrue();
    req.flush({});
  });

  it('leaves absolute URLs untouched', () => {
    http.get('https://example.com/somewhere').subscribe();
    const req = httpMock.expectOne('https://example.com/somewhere');
    expect(req.request.url).toBe('https://example.com/somewhere');
    req.flush({});
  });
});