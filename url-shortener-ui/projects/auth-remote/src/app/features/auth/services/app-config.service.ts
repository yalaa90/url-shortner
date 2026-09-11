import { Injectable, signal } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config = signal<AppConfig>({
    apiBaseUrl: 'http://localhost:8080',
  });

  apiBaseUrl(): string {
    return this.config().apiBaseUrl;
  }

  registerRedirectUrl(): string {
    return '';
  }
}
