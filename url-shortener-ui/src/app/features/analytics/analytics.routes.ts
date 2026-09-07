import { Routes } from '@angular/router';
import { ShellComponent } from '../../core/layout/shell.component';

export const analyticsRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
    ],
  },
];