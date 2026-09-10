import { analyticsRoutes } from './analytics.routes';
import { ShellComponent } from '../../core/layout/shell.component';

describe('analytics routes', () => {
  it('uses the shell layout', () => {
    expect(analyticsRoutes[0]?.component).toBe(ShellComponent);
  });

  it('lazy-loads the analytics page as the child content', () => {
    const child = analyticsRoutes[0]?.children?.find((r) => r.path === '');
    expect(child?.loadComponent).toBeDefined();
  });
});