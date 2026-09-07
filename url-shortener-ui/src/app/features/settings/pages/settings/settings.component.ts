import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from '../../../../core/services/theme.service';
import { Store } from '@ngrx/store';
import { authActions } from '../../../../state/auth/auth.actions';
import { selectCurrentUser } from '../../../../state/auth/auth.selectors';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1>Settings</h1>
        <p class="subtitle">Manage your preferences and account.</p>
      </header>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon fontIcon="palette_outlined"></mat-icon>
          <mat-card-title>Appearance</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Dark mode</span>
              <span class="setting-description">Use a darker color scheme across the app.</span>
            </div>
            <mat-slide-toggle
              [checked]="themeService.darkMode()"
              (change)="onThemeToggle($event.checked)"
              aria-label="Toggle dark mode"
            ></mat-slide-toggle>
          </div>
          <mat-divider />
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon fontIcon="account_circle_outlined"></mat-icon>
          <mat-card-title>Account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Email</span>
              <span class="setting-description">{{ (currentUser$ | async)?.email ?? 'Not signed in' }}</span>
            </div>
          </div>
          <mat-divider />
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Roles</span>
              <span class="setting-description">{{ ((currentUser$ | async)?.roles ?? []).join(', ') || 'Standard user' }}</span>
            </div>
          </div>
          <mat-divider />
          <div class="setting-row">
            <button mat-raised-button color="warn" (click)="logout()">
              <mat-icon fontIcon="logout"></mat-icon>
              Sign out
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page-header {
        margin-bottom: 24px;
      }
      .subtitle {
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
        margin: 0;
      }
      .settings-card {
        margin-bottom: 24px;
        max-width: 720px;
      }
      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px 0;
      }
      .setting-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .setting-label {
        font-weight: 600;
      }
      .setting-description {
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
      }
    `,
  ],
})
export class SettingsComponent {
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);
  readonly themeService = inject(ThemeService);
  readonly currentUser$ = this.store.select(selectCurrentUser);

  onThemeToggle(dark: boolean): void {
    if (this.themeService.darkMode() !== dark) {
      this.themeService.toggle();
    }
    this.snackBar.open(`${dark ? 'Dark' : 'Light'} mode enabled`, 'Dismiss', { duration: 2000 });
  }

  logout(): void {
    this.store.dispatch(authActions.logout());
  }
}