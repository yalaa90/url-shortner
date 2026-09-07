import { Routes } from '@angular/router';
import { ShellComponent } from '../../core/layout/shell.component';

export const linkManagementRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/link-list/link-list.component').then((m) => m.LinkListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/link-create/link-create.component').then((m) => m.LinkCreateComponent),
      },
      {
        path: ':code',
        loadComponent: () =>
          import('./pages/link-detail/link-detail.component').then((m) => m.LinkDetailComponent),
      },
    ],
  },
];