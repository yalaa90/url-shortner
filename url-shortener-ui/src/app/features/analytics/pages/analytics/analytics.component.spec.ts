import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AnalyticsComponent } from './analytics.component';

describe('AnalyticsComponent', () => {
  let fixture: ComponentFixture<AnalyticsComponent>;
  let component: AnalyticsComponent;
  let httpMock: HttpTestingController;

  const summary = {
    shortCode: 'abc',
    totalClicks: 100,
    uniqueVisitors: 40,
    referrers: { google: 60 },
    countries: { US: 1, DE: 1 },
    timeSeries: [] as { timestamp: string; clicks: number }[],
  };

  const keyValues = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.kpi-value')).map(
      (el) => (el as HTMLElement).textContent?.trim() ?? ''
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AnalyticsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads analytics with a default of 30 days and renders the KPIs', async () => {
    component.code = 'abc';
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/v1/analytics/abc?days=30');
    expect(req.request.method).toBe('GET');
    req.flush({ data: summary });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(keyValues()).toEqual(['100', '40', '2']);
    expect(fixture.nativeElement.querySelector('ngx-charts-line-chart')).toBeTruthy();
  });

  it('relaunches the request when the range changes', async () => {
    component.code = 'abc';
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/analytics/abc?days=30').flush({ data: summary });
    await fixture.whenStable();

    component.onRangeChange({ value: 7 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.rangeDays).toBe(7);
    httpMock
      .expectOne('/api/v1/analytics/abc?days=7')
      .flush({ data: { ...summary, totalClicks: 5, uniqueVisitors: 2 } });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(keyValues()).toEqual(['5', '2', '2']);
  });

  it('shows a zeroed summary when the request fails', async () => {
    component.code = 'abc';
    fixture.detectChanges();
    httpMock
      .expectOne('/api/v1/analytics/abc?days=30')
      .flush({ error: 'boom' }, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(keyValues()).toEqual(['0', '0', '0']);
    expect(fixture.nativeElement.textContent).toContain('abc');
  });

  it('renders the range toggle with 7/30/90 day options', async () => {
    component.code = 'abc';
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('mat-button-toggle')
    ).map((b) => (b as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['7d', '30d', '90d']);
    expect(component.rangeDays).toBe(30);

    httpMock.expectOne('/api/v1/analytics/abc?days=30').flush({ data: summary });
    await fixture.whenStable();
  });
});