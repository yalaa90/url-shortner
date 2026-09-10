import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService, TokenResponse } from './auth.service';

function buildToken(payload: Record<string, unknown>): string {
  const enc = (obj: object): string =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('exposes no tokens initially', () => {
    expect(service.accessToken).toBeNull();
    expect(service.refreshToken).toBeNull();
  });

  describe('login', () => {
    it('posts form-encoded credentials and stores tokens', () => {
      const response: TokenResponse = {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      service.login('user@example.com', 'secret').subscribe((res) => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne('/api/v1/auth/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );

      const body = new URLSearchParams(req.request.body);
      expect(body.get('grant_type')).toBe('password');
      expect(body.get('username')).toBe('user@example.com');
      expect(body.get('password')).toBe('secret');
      expect(body.get('client_id')).toBe('url-shortener-ui');

      req.flush(response);
      expect(service.accessToken).toBe('access-1');
      expect(service.refreshToken).toBe('refresh-1');
    });
  });

  describe('logout', () => {
    it('clears stored tokens', () => {
      service['storeTokens']({ access_token: 'a', refresh_token: 'r' });
      service.logout().subscribe();
      expect(service.accessToken).toBeNull();
      expect(service.refreshToken).toBeNull();
    });
  });

  describe('refresh', () => {
    it('returns an empty token response without a refresh token', () => {
      service.refresh().subscribe((res) => {
        expect(res).toEqual({ access_token: '', token_type: 'Bearer' });
      });
      httpMock.expectNone('/api/v1/auth/token');
    });

    it('exchanges the stored refresh token', () => {
      localStorage.setItem('urlshortener_refresh_token', 'refresh-1');
      const response: TokenResponse = { access_token: 'new-access', refresh_token: 'new-refresh' };

      service.refresh().subscribe((res) => expect(res).toEqual(response));

      const req = httpMock.expectOne('/api/v1/auth/token');
      const body = new URLSearchParams(req.request.body);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('refresh-1');
      req.flush(response);
      expect(service.accessToken).toBe('new-access');
    });

    it('clears tokens and rethrows on error', () => {
      localStorage.setItem('urlshortener_refresh_token', 'refresh-1');
      const caught = jasmine.createSpy('caught');
      service.refresh().subscribe({ error: (err) => caught(err) });

      httpMock.expectOne('/api/v1/auth/token').error(new ErrorEvent('boom'), { status: 401 });
      expect(caught).toHaveBeenCalled();
      expect(service.refreshToken).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('decodes an empty profile when no token exists', () => {
      service.getProfile().subscribe((profile) => {
        expect(profile.email).toBe('');
        expect(profile.displayName).toBe('');
        expect(profile.roles).toEqual([]);
      });
      httpMock.expectNone('/api/v1/users/me');
    });

    it('fetches the profile from the API', () => {
      localStorage.setItem('urlshortener_access_token', 'some-token');
      const profile = {
        id: '1',
        email: 'user@example.com',
        roles: ['user'],
        emailVerified: true,
      };

      service.getProfile().subscribe((p) => expect(p).toEqual(profile));

      const req = httpMock.expectOne('/api/v1/users/me');
      expect(req.request.method).toBe('GET');
      req.flush(profile);
    });

    it('falls back to decoding the token when the API call fails', () => {
      const token = buildToken({
        email: 'fallback@example.com',
        name: 'Fallback User',
        realm_access: { roles: ['user'] },
      });
      localStorage.setItem('urlshortener_access_token', token);

      service.getProfile().subscribe((profile) => {
        expect(profile.email).toBe('fallback@example.com');
        expect(profile.displayName).toBe('Fallback User');
        expect(profile.roles).toEqual(['user']);
      });

      httpMock.expectOne('/api/v1/users/me').error(new ErrorEvent('boom'));
    });
  });

  describe('isAuthenticated', () => {
    it('returns false without a token', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('returns true when the token has no expiry', () => {
      localStorage.setItem('urlshortener_access_token', buildToken({}));
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('returns true for a token expiring in the future', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem('urlshortener_access_token', buildToken({ exp }));
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('returns false for an expired token', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600;
      localStorage.setItem('urlshortener_access_token', buildToken({ exp }));
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('hasRole', () => {
    it('returns false without a token', () => {
      expect(service.hasRole('admin')).toBeFalse();
    });

    it('returns true when the token carries the role', () => {
      localStorage.setItem(
        'urlshortener_access_token',
        buildToken({ realm_access: { roles: ['user', 'admin'] } })
      );
      expect(service.hasRole('admin')).toBeTrue();
      expect(service.hasRole('moderator')).toBeFalse();
    });
  });
});