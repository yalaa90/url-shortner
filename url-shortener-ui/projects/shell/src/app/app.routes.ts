import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remotes.auth,
        exposedModule: './authRoutes',
      }).then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remotes.links,
        exposedModule: './routes',
      }).then((m) => m.dashboardRoutes),
  },
  {
    path: 'links',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remotes.links,
        exposedModule: './routes',
      }).then((m) => m.linkManagementRoutes),
  },
  {
    path: 'analytics/:code',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remotes.analytics,
        exposedModule: './analyticsRoutes',
      }).then((m) => m.analyticsRoutes),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 's/:code',
    loadComponent: () =>
      import('./features/redirect/redirect.component').then((m) => m.RedirectComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
