import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppConfigService } from '../../core/services/app-config.service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  template: `
    <div class="redirect-container">
      @switch (state) {
        @case ('loading') {
          <mat-spinner diameter="40" />
          <p>Resolving link...</p>
        }
        @case ('notFound') {
          <mat-icon fontIcon="link_off" class="error-icon"></mat-icon>
          <h1>Link not found</h1>
          <p>The short link you followed is invalid or has expired.</p>
          <a routerLink="/dashboard" mat-raised-button color="primary">Go to Dashboard</a>
        }
        @case ('error') {
          <mat-icon fontIcon="error_outline" class="error-icon"></mat-icon>
          <h1>Something went wrong</h1>
          <p>We could not resolve this link right now.</p>
          <a routerLink="/dashboard" mat-raised-button>Go to Dashboard</a>
        }
      }
    </div>
  `,
  styles: [
    `
      .redirect-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        text-align: center;
      }
      .error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--sys-error, #b3261e);
      }
    `,
  ],
})
export class RedirectComponent implements OnInit {
  state: 'loading' | 'notFound' | 'error' = 'loading';

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.state = 'notFound';
      return;
    }

    const base = this.config.apiBaseUrl();
    this.http
      .get(`${base}/api/v1/links/${encodeURIComponent(code)}`, { observe: 'response' })
      .subscribe({
        next: (response) => {
          if (response.status === 200 && response.body && typeof response.body === 'object') {
            const destination = (response.body as { data?: { originalUrl?: string } }).data?.originalUrl;
            if (destination) {
              window.location.replace(destination);
              return;
            }
          }
          this.state = 'notFound';
        },
        error: (err) => {
          this.state = err.status === 404 ? 'notFound' : 'error';
        },
      });
  }
}