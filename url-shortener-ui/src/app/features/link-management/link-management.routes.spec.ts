import { linkManagementRoutes } from './link-management.routes';
import { ShellComponent } from '../../core/layout/shell.component';

describe('link-management routes', () => {
  it('uses the shell layout', () => {
    expect(linkManagementRoutes[0]?.component).toBe(ShellComponent);
  });

  it('lazy-loads list, create and detail pages', () => {
    const children = linkManagementRoutes[0]?.children ?? [];
    const byPath = new Map(children.map((r) => [r.path, r]));

    expect(byPath.get('')?.loadComponent).toBeDefined();
    expect(byPath.get('create')?.loadComponent).toBeDefined();
    expect(byPath.get(':code')?.loadComponent).toBeDefined();
  });
});