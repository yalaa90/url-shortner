import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from '../services/app-config.service';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http')) {
    return next(req);
  }

  const config = inject(AppConfigService);
  const baseUrl = config.apiBaseUrl();

  const apiReq = req.clone({
    url: `${baseUrl}${req.url}`,
  });

  return next(apiReq);
};