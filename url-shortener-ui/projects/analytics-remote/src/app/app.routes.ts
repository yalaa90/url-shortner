import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const analyticsRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/analytics/pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
    ],
  },
];
