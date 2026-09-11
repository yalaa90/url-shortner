import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ShellComponent } from './core/layout/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { linkReducer } from './state/links/link.reducer';
import { LinkEffects } from './state/links/link.effects';

const linkStoreProviders = [provideState('links', linkReducer), provideEffects([LinkEffects])];

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    providers: linkStoreProviders,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
];

export const linkManagementRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    providers: linkStoreProviders,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/link-management/pages/link-list/link-list.component').then((m) => m.LinkListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/link-management/pages/link-create/link-create.component').then((m) => m.LinkCreateComponent),
      },
      {
        path: ':code',
        loadComponent: () =>
          import('./features/link-management/pages/link-detail/link-detail.component').then((m) => m.LinkDetailComponent),
      },
    ],
  },
];
