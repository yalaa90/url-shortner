import { APP_INITIALIZER, makeEnvironmentProviders } from '@angular/core';
import { AppConfigService } from './services/app-config.service';

export function initializeApp(config: AppConfigService) {
  return (): Promise<void> => Promise.resolve();
}

export const coreConfig = makeEnvironmentProviders([
  {
    provide: APP_INITIALIZER,
    useFactory: initializeApp,
    deps: [AppConfigService],
    multi: true,
  },
]);