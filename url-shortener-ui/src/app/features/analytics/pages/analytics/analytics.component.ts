import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { AnalyticsApiService, AnalyticsSummary } from '../../../../core/services/analytics-api.service';
import { ClickChartComponent } from '../../components/click-chart/click-chart.component';
import { ReferrerTableComponent } from '../../components/referrer-table/referrer-table.component';
import { ObjectSizePipe } from '../../../../shared/pipes/object-size.pipe';

const emptySummary: AnalyticsSummary = {
  shortCode: '',
  totalClicks: 0,
  uniqueVisitors: 0,
  referrers: {},
  countries: {},
  timeSeries: [],
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    ClickChartComponent,
    ReferrerTableComponent,
    ObjectSizePipe,
  ],
  template: `
    <div class="analytics-page">
      <header class="page-header">
        <div>
          <h1>Analytics</h1>
          <p class="subtitle">Performance for <code>{{ code }}</code></p>
        </div>
        <a mat-button routerLink="/links" aria-label="Back to links">
          Back
        </a>
      </header>

      <mat-button-toggle-group
        [value]="rangeDays"
        (change)="onRangeChange($event)"
        aria-label="Date range"
        class="range-toggle"
      >
        <mat-button-toggle [value]="7">7d</mat-button-toggle>
        <mat-button-toggle [value]="30">30d</mat-button-toggle>
        <mat-button-toggle [value]="90">90d</mat-button-toggle>
      </mat-button-toggle-group>

      @if (summary$ | async; as summary) {
        <section class="kpi-grid" aria-label="Key metrics">
          <mat-card class="kpi-card">
            <mat-card-content>
              <span class="kpi-value">{{ summary.totalClicks }}</span>
              <span class="kpi-label">Total clicks</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <span class="kpi-value">{{ summary.uniqueVisitors }}</span>
              <span class="kpi-label">Unique visitors</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <span class="kpi-value">{{ summary.countries | objectSize }}</span>
              <span class="kpi-label">Countries</span>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="widgets-grid">
          <app-click-chart [points]="summary.timeSeries"></app-click-chart>
        </section>

        <section class="widgets-grid">
          <app-referrer-table [referrers]="summary.referrers"></app-referrer-table>
        </section>
      } @else {
        <div class="loading-box">
          <mat-spinner diameter="40" />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .subtitle {
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
        margin: 0;
      }
      .range-toggle {
        margin-bottom: 24px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .kpi-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 20px;
      }
      .kpi-value {
        font-size: 1.75rem;
        font-weight: 700;
      }
      .kpi-label {
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
      }
      .widgets-grid {
        display: grid;
        gap: 16px;
        margin-bottom: 24px;
      }
      .loading-box {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  @Input() code = '';

  summary$!: Observable<AnalyticsSummary>;
  rangeDays = 30;

  private readonly analyticsApi = inject(AnalyticsApiService);

  ngOnInit(): void {
    this.summary$ = this.load();
  }

  onRangeChange(event: { value: number }): void {
    this.rangeDays = event.value;
    this.summary$ = this.load();
  }

  private load(): Observable<AnalyticsSummary> {
    return this.analyticsApi.getAnalytics(this.code, this.rangeDays).pipe(
      map((response) => response.data),
      catchError(() => of({ ...emptySummary, shortCode: this.code })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
