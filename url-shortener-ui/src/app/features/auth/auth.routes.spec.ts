import { authRoutes } from './auth.routes';
import { guestGuard } from '../../core/guards/auth.guard';

describe('auth routes', () => {
  it('lazy-loads the login page behind the guest guard', () => {
    const login = authRoutes.find((r) => r.path === 'login');
    expect(login?.loadComponent).toBeDefined();
    expect(login?.canActivate).toContain(guestGuard);
  });

  it('lazy-loads the register page behind the guest guard', () => {
    const register = authRoutes.find((r) => r.path === 'register');
    expect(register?.loadComponent).toBeDefined();
    expect(register?.canActivate).toContain(guestGuard);
  });

  it('redirects the empty path to login', () => {
    const empty = authRoutes.find((r) => r.path === '');
    expect(empty?.redirectTo).toBe('login');
  });
});