import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { AppConfigService } from '../services/app-config.service';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http')) {
    return next(req);
  }

  const config = inject(AppConfigService);
  const baseUrl = config.apiBaseUrl();

  return next(req.clone({ url: `${baseUrl}${req.url}` }));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.endsWith('/auth/token') || req.url.includes('/auth/')) {
    return next(req);
  }

  const token = localStorage.getItem('urlshortener_access_token');

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      let message = 'An unexpected error occurred';

      if (error.status === 401) {
        message = 'Your session has expired. Please sign in again.';
        router.navigate(['/auth/login']);
        return EMPTY;
      }

      if (error.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        message = 'Resource not found.';
      } else if (error.status >= 500) {
        message = 'Server error. Our team has been notified.';
      } else if (error.error?.detail) {
        message = error.error.detail;
      }

      snackBar.open(message, 'Dismiss', { duration: 5000 });

      return throwError(() => error);
    })
  );
};