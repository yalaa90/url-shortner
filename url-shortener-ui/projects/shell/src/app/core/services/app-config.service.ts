import { Injectable, signal } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
  analyticsSseUri: string;
  registrationUri: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config = signal<AppConfig>({
    apiBaseUrl: 'http://localhost:8080',
    issuer: 'http://localhost:8083/api/v1/auth',
    clientId: 'url-shortener-ui',
    redirectUri: 'http://localhost:4200/auth/callback',
    analyticsSseUri: 'http://localhost:8080/api/v1/analytics',
    registrationUri: '',
  });

  apiBaseUrl(): string {
    return this.config().apiBaseUrl;
  }

  registerRedirectUrl(): string {
    return this.config().registrationUri;
  }
}