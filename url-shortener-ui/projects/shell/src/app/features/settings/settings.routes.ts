import { Routes } from '@angular/router';
import { ShellComponent } from '../../core/layout/shell.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
];