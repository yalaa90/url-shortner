import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { dashboardRoutes, linkManagementRoutes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core/interceptors/http.interceptors';
import { baseUrlInterceptor } from './core/interceptors/base-url.interceptor';

const allRoutes = [...dashboardRoutes, ...linkManagementRoutes];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(allRoutes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([baseUrlInterceptor, authInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    provideStore(),
    provideStoreDevtools({ maxAge: 25, connectInZone: true }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'auto' },
    },
  ],
};