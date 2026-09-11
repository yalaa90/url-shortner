import { Injectable } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config: AppConfig = { apiBaseUrl: 'http://localhost:8080' };

  apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }
}