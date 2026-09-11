import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { ShortLink, CopyToClipboardComponent, DateFormatPipe, TruncatePipe } from '@shared-lib';
import QRCode from 'qrcode';

interface DetailResponse {
  data?: ShortLink;
}

@Component({
  selector: 'app-link-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CopyToClipboardComponent,
    DateFormatPipe,
    TruncatePipe,
  ],
  template: `
    <div class="detail-page">
      <header class="page-header">
        <div>
          <h1>Link Details</h1>
          <p class="subtitle" *ngIf="link$ | async as link">{{ link.shortUrl }}</p>
        </div>
        <a mat-button routerLink="/links" aria-label="Back to links">
          Back
        </a>
      </header>

      @if (link$ | async; as link) {
        <mat-card>
          <mat-card-content>
            <div class="short-url-preview">
              <a [href]="link.shortUrl" target="_blank" rel="noopener">{{ link.shortUrl }}</a>
              <app-copy-to-clipboard [text]="link.shortUrl"></app-copy-to-clipboard>
            </div>

            <dl class="detail-grid">
              <div class="detail-row">
                <dt>Destination</dt>
                <dd [title]="link.originalUrl">{{ link.originalUrl }}</dd>
              </div>
              <div class="detail-row">
                <dt>Short Code</dt>
                <dd><code>{{ link.shortCode }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd>
                  <span [class]="'status-chip ' + (link.active ? 'status-active' : 'status-inactive')">
                    {{ link.active ? 'Active' : 'Disabled' }}
                  </span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>Clicks</dt>
                <dd>{{ link.clickCount }}</dd>
              </div>
              <div class="detail-row">
                <dt>Created</dt>
                <dd>{{ link.createdAt | dateFormat: 'long' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Expires</dt>
                <dd>{{ link.expiresAt ? (link.expiresAt | dateFormat: 'long') : 'Never' }}</dd>
              </div>
            </dl>

            <div class="qr-box">
              <img [src]="qrCode" alt="QR code for short link" />
            </div>

            <div class="detail-actions">
              <a mat-raised-button color="primary" [routerLink]="['/analytics', link.shortCode]">
                View Analytics
              </a>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="loading-box">
          <mat-spinner diameter="40" />
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .subtitle { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); margin: 0; max-width: 640px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .short-url-preview { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; margin-bottom: 16px; padding: 12px; background: rgba(0, 0, 0, 0.04); border-radius: 8px; }
    .short-url-preview a { flex: 1; text-decoration: none; word-break: break-all; color: var(--sys-primary, #6750a4); }
    .detail-grid { margin: 0; }
    .detail-row { display: grid; grid-template-columns: 140px 1fr; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
    .detail-row dt { font-weight: 600; color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); }
    .detail-row dd { margin: 0; word-break: break-all; }
    .status-chip { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-active { background: rgba(46, 125, 50, 0.12); color: #2e7d32; }
    .status-inactive { background: rgba(0, 0, 0, 0.08); color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); }
    .qr-box { margin-top: 16px; }
    .qr-box img { width: 160px; height: 160px; border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.12); }
    .detail-actions { margin-top: 16px; display: flex; gap: 12px; }
    .loading-box { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class LinkDetailComponent implements OnInit {
  readonly link$: Observable<ShortLink | undefined>;
  qrCode = '';

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  constructor() {
    const code: string = this.route.snapshot.paramMap.get('code') ?? '';
    this.link$ = this.http
      .get<DetailResponse>(`${this.config.apiBaseUrl()}/api/v1/links/${encodeURIComponent(code)}/details`)
      .pipe(
        map((response) => response.data),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  ngOnInit(): void {
    this.link$.subscribe((link) => {
      if (link) {
        void QRCode.toDataURL(link.shortUrl, { width: 320, margin: 1 }).then(
          (dataUrl) => (this.qrCode = dataUrl)
        );
      }
    });
  }
}