import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'links',
    canActivate: [authGuard],
    loadChildren: () => import('./features/link-management/link-management.routes').then((m) => m.linkManagementRoutes),
  },
  {
    path: 'analytics/:code',
    canActivate: [authGuard],
    loadChildren: () => import('./features/analytics/analytics.routes').then((m) => m.analyticsRoutes),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 's/:code',
    loadComponent: () => import('./features/redirect/redirect.component').then((m) => m.RedirectComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];