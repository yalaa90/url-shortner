import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { AuthService } from '../services/auth.service';
import { Store } from '@ngrx/store';
import { authActions } from '../../state/auth/auth.actions';
import { selectCurrentUser } from '../../state/auth/auth.selectors';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav mode="side" opened class="shell-sidenav">
        <div class="sidenav-brand">
          <mat-icon fontIcon="link"></mat-icon>
          <span class="brand-name">URL Shortener</span>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" aria-label="Dashboard">
            <mat-icon matListItemIcon fontIcon="dashboard"></mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/links" routerLinkActive="active-link" aria-label="My Links">
            <mat-icon matListItemIcon fontIcon="link"></mat-icon>
            <span matListItemTitle>My Links</span>
          </a>
          <a mat-list-item routerLink="/settings" routerLinkActive="active-link" aria-label="Settings">
            <mat-icon matListItemIcon fontIcon="settings"></mat-icon>
            <span matListItemTitle>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <mat-toolbar class="shell-toolbar">
          <span class="toolbar-title">URL Shortener</span>
          <span class="toolbar-spacer"></span>
          <button
            mat-icon-button
            (click)="themeService.toggle()"
            [attr.aria-label]="themeService.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            matTooltip="Toggle theme"
          >
            <mat-icon [fontIcon]="themeService.darkMode() ? 'light_mode' : 'dark_mode'"></mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
            <mat-icon fontIcon="account_circle"></mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item disabled>
              <mat-icon fontIcon="person_outline"></mat-icon>
              <span>{{ (currentUser$ | async)?.email ?? 'User' }}</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="logout()">
              <mat-icon fontIcon="logout"></mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="shell-main">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell-container {
        height: 100vh;
      }
      .shell-sidenav {
        width: 240px;
        border-right: 1px solid rgba(0, 0, 0, 0.08);
      }
      .sidenav-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px;
        font-weight: 600;
        font-size: 1.1rem;
      }
      .brand-name {
        white-space: nowrap;
      }
      .active-link {
        background: var(--mat-toolbar-container-background-color);
      }
      .shell-content {
        display: flex;
        flex-direction: column;
      }
      .shell-toolbar {
        gap: 8px;
      }
      .toolbar-spacer {
        flex: 1 1 auto;
      }
      .shell-main {
        flex: 1;
        overflow: auto;
        padding: 24px;
        max-width: 1200px;
        width: 100%;
        box-sizing: border-box;
        margin: 0 auto;
      }
    `,
  ],
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  readonly themeService = inject(ThemeService);
  readonly currentUser$ = this.store.select(selectCurrentUser);

  logout(): void {
    this.store.dispatch(authActions.logout());
  }
}