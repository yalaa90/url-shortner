import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { authRoutes } from './app.routes';
import { authReducer } from './features/auth/state/auth.reducer';
import { AuthEffects } from './features/auth/state/auth.effects';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';
import { errorInterceptor } from './features/auth/interceptors/error.interceptor';
import { baseUrlInterceptor } from './features/auth/interceptors/base-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(authRoutes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([baseUrlInterceptor, authInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    provideStore(),
    provideState('auth', authReducer),
    provideEffects([AuthEffects]),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'auto' },
    },
  ],
};