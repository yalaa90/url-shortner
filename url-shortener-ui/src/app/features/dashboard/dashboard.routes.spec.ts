import { dashboardRoutes } from './dashboard.routes';
import { ShellComponent } from '../../core/layout/shell.component';

describe('dashboard routes', () => {
  it('uses the shell layout for the empty path', () => {
    const shell = dashboardRoutes.find((r) => r.path === '');
    expect(shell?.component).toBe(ShellComponent);
  });

  it('lazy-loads the dashboard page as the child content', () => {
    const child = dashboardRoutes[0]?.children?.find((r) => r.path === '');
    expect(child?.loadComponent).toBeDefined();
  });
});