import { settingsRoutes } from './settings.routes';
import { ShellComponent } from '../../core/layout/shell.component';

describe('settings routes', () => {
  it('uses the shell layout', () => {
    expect(settingsRoutes[0]?.component).toBe(ShellComponent);
  });

  it('lazy-loads the settings page as the child content', () => {
    const child = settingsRoutes[0]?.children?.find((r) => r.path === '');
    expect(child?.loadComponent).toBeDefined();
  });
});