import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { linkActions } from '../../../../state/links/link.actions';
import { selectLinks, selectLinksLoading } from '../../../../state/links/link.selectors';
import { ShortLink } from '@shared-lib';
import { DateFormatPipe, TruncatePipe, CopyToClipboardComponent } from '@shared-lib';

export interface StatCard {
  label: string;
  value: number;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    DateFormatPipe,
    TruncatePipe,
    CopyToClipboardComponent,
  ],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Overview of your short links.</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/links/create" aria-label="Create a new link">
          New Link
        </a>
      </header>

      <section class="stats-grid" aria-label="Link statistics">
        @for (stat of statCards$ | async; track stat.label) {
          <mat-card class="stat-card" [style.--stat-accent]="stat.accent">
            <mat-card-content>
              <div class="stat-details">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </section>

      <section class="recent-section">
        <div class="section-heading">
          <h2>Recent Links</h2>
          <a mat-button routerLink="/links" aria-label="View all links">View all</a>
        </div>

        @if (loading$ | async) {
          <div class="loading-box">
            <mat-spinner diameter="32" />
          </div>
        } @else if ((recentLinks$ | async)?.length) {
          <mat-card>
            <mat-card-content>
              <mat-list>
                @for (link of recentLinks$ | async; track link.shortCode) {
                  <mat-list-item class="recent-item">
                    <div matListItemTitle class="recent-title">
                      <span class="short-url">{{ link.shortUrl }}</span>
                      <app-copy-to-clipboard [text]="link.shortUrl"></app-copy-to-clipboard>
                    </div>
                    <div matListItemLine class="recent-original">
                      {{ link.originalUrl | truncate: 80 }}
                      <span class="created-at">{{ link.createdAt | dateFormat: 'relative' }}</span>
                    </div>
                    <div matListItemMeta class="recent-clicks">
                      {{ link.clickCount }} clicks
                    </div>
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card>
            <mat-card-content class="empty-state">
              <p>No links yet. Create your first short link.</p>
              <a mat-flat-button color="primary" routerLink="/links/create">Create a Link</a>
            </mat-card-content>
          </mat-card>
        }
      </section>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .subtitle { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-details { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 700; line-height: 1.2; }
    .stat-label { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); font-size: 0.9rem; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .loading-box { display: flex; justify-content: center; padding: 48px; }
    .recent-title { display: flex; align-items: center; gap: 4px; }
    .short-url { font-weight: 600; }
    .recent-original { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); }
    .created-at { margin-left: 8px; font-size: 0.8rem; }
    .recent-clicks { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; text-align: center; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);

  readonly recentLinks$: Observable<ShortLink[]> = this.store
    .select(selectLinks)
    .pipe(map((links) => [...links].slice(0, 5)));
  readonly loading$: Observable<boolean> = this.store.select(selectLinksLoading);

  readonly statCards$: Observable<StatCard[]> = this.store.select(selectLinks).pipe(
    map((links) => {
      const total = links.length;
      const active = links.filter((link) => link.active).length;
      const clicks = links.reduce((sum, link) => sum + (link.clickCount ?? 0), 0);
      const average = total ? Math.round(clicks / total) : 0;
      return [
        { label: 'Total Links', value: total, accent: '#6750A4' },
        { label: 'Active Links', value: active, accent: '#2E7D32' },
        { label: 'Total Clicks', value: clicks, accent: '#1565C0' },
        { label: 'Avg Clicks / Link', value: average, accent: '#EF6C00' },
      ];
    })
  );

  ngOnInit(): void {
    this.store.dispatch(linkActions.loadLinks({ page: 0, size: 20 }));
  }
}