import { Routes } from '@angular/router';
import { ShellComponent } from '../../core/layout/shell.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
];