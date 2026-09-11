import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

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
      } else if (error.status === 409) {
        message = error.error?.detail ?? 'The resource already exists.';
      } else if (error.status === 429) {
        message = 'Too many requests. Please try again shortly.';
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