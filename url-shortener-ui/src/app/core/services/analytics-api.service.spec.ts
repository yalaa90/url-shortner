import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AnalyticsApiService, AnalyticsSummary } from './analytics-api.service';

describe('AnalyticsApiService', () => {
  let service: AnalyticsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches analytics with the default 30-day window', () => {
    const summary: AnalyticsSummary = {
      shortCode: 'abc',
      totalClicks: 10,
      uniqueVisitors: 4,
      referrers: { google: 5 },
      countries: { US: 3 },
      timeSeries: [{ timestamp: '2024-01-01T00:00:00Z', clicks: 2 }],
    };
    const response = { success: true, data: summary };

    service.getAnalytics('abc').subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/analytics/abc');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('days')).toBe('30');
    req.flush(response);
  });

  it('passes through a custom day window', () => {
    service.getAnalytics('abc', 7).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/analytics/abc');
    expect(req.request.params.get('days')).toBe('7');
    req.flush({ success: true, data: null });
  });
});