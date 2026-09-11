import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { selectAccessToken } from '../state/auth.selectors';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.endsWith('/auth/token') || req.url.includes('/auth/')) {
    return next(req);
  }

  const store = inject(Store);
  let token: string | null | undefined;

  store.select(selectAccessToken).pipe(take(1)).subscribe((t) => (token = t));

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
