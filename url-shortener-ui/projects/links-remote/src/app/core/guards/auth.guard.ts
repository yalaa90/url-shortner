import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

declare const window: unknown;

function readToken(): string | null {
  try {
    return localStorage.getItem('urlshortener_access_token');
  } catch {
    return null;
  }
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = readToken();
  if (token) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
};