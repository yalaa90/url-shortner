import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('urlshortener_access_token');
  if (token) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
};