import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';

describe('app routes', () => {
  it('redirects the root path to the dashboard', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('dashboard');
    expect(root?.pathMatch).toBe('full');
  });

  it('exposes lazy auth routes', () => {
    const auth = routes.find((r) => r.path === 'auth');
    expect(auth?.loadChildren).toBeDefined();
    expect(auth?.canActivate).toBeUndefined();
  });

  it('protects privileged sections with the auth guard', () => {
    for (const path of ['dashboard', 'links', 'analytics/:code', 'settings']) {
      const route = routes.find((r) => r.path === path);
      expect(route?.canActivate).toContain(authGuard);
      expect(route?.loadChildren).toBeDefined();
    }
  });

  it('defines the public short-link redirect route', () => {
    const short = routes.find((r) => r.path === 's/:code');
    expect(short?.loadComponent).toBeDefined();
    expect(short?.canActivate).toBeUndefined();
  });

  it('catches unknown paths', () => {
    const fallback = routes.find((r) => r.path === '**');
    expect(fallback?.redirectTo).toBe('dashboard');
  });
});