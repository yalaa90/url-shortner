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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';

interface SnackBarCall {
  message: string;
  action?: string;
  config?: unknown;
}

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let lastMessage: string | undefined;

  function lastSnackCall(): SnackBarCall {
    return snackBar.open.calls.mostRecent().args as unknown as SnackBarCall;
  }

  beforeEach(() => {
    lastMessage = undefined;
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    snackBar.open.and.callFake((message: string) => {
      lastMessage = message;
      return jasmine.createSpyObj('MatSnackBarRef', ['dismiss']);
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('redirects to login on 401 and swallows the error', () => {
    const completed = jasmine.createSpy('completed');
    http.get('/api/v1/links').subscribe({ complete: completed });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('unauthorized'), { status: 401 });

    expect(completed).toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('shows a permission message on 403', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('forbidden'), { status: 403 });

    expect(error).toHaveBeenCalled();
    expect(lastMessage).toBe('You do not have permission to perform this action.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows a not found message on 404', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links/missing').subscribe({ error });

    httpMock.expectOne('/api/v1/links/missing').error(new ErrorEvent('missing'), { status: 404 });

    expect(lastMessage).toBe('Resource not found.');
    expect(error).toHaveBeenCalled();
  });

  it('shows the predefined conflict message when 409 has no detail', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('conflict'), { status: 409 });

    expect(lastMessage).toBe('The resource already exists.');
    expect(error).toHaveBeenCalled();
  });

  it('shows the server-provided detail when 409 provides one', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock
      .expectOne('/api/v1/links')
      .flush({ detail: 'Alias is already in use' }, { status: 409, statusText: 'Conflict' });

    expect(lastMessage).toBe('Alias is already in use');
    expect(error).toHaveBeenCalled();
  });

  it('shows a rate limit message on 429', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('limited'), { status: 429 });

    expect(lastMessage).toBe('Too many requests. Please try again shortly.');
  });

  it('shows a server error message on 5xx', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('internal'), { status: 500 });

    expect(lastMessage).toBe('Server error. Our team has been notified.');
  });

  it('falls back to the detail message for unhandled statuses', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock
      .expectOne('/api/v1/links')
      .flush({ detail: 'invalid input' }, { status: 422, statusText: 'Unprocessable' });

    expect(lastMessage).toBe('invalid input');
    expect(error).toHaveBeenCalled();
  });

  it('falls back to a generic message otherwise', () => {
    const error = jasmine.createSpy('error');
    http.get('/api/v1/links').subscribe({ error });

    httpMock.expectOne('/api/v1/links').error(new ErrorEvent('network'), { status: 0 });

    expect(lastMessage).toBe('An unexpected error occurred');
    expect(error).toHaveBeenCalled();
  });
});