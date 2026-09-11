import { TestBed } from '@angular/core/testing';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppConfigService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the default API base URL', () => {
    expect(service.apiBaseUrl()).toBe('http://localhost:8080');
  });

  it('returns an empty registration URI by default', () => {
    expect(service.registerRedirectUrl()).toBe('');
  });
});