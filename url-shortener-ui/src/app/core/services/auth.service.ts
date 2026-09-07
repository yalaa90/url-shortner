import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  emailVerified: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'urlshortener_access_token';
  private readonly REFRESH_KEY = 'urlshortener_refresh_token';

  constructor(private readonly http: HttpClient) {}

  get accessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  login(username: string, password: string): Observable<TokenResponse> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', username);
    body.set('password', password);
    body.set('client_id', 'url-shortener-ui');

    return this.http
      .post<TokenResponse>('/auth/token', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(tap((response) => this.storeTokens(response)));
  }

  logout(): Observable<void> {
    this.clearTokens();
    return of(undefined);
  }

  refresh(): Observable<TokenResponse> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return of({ access_token: '', token_type: 'Bearer' });
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);
    body.set('client_id', 'url-shortener-ui');

    return this.http
      .post<TokenResponse>('/auth/token', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((response) => this.storeTokens(response)),
        catchError((_error) => {
          this.clearTokens();
          throw _error;
        })
      );
  }

  getProfile(): Observable<UserProfile> {
    const token = this.accessToken;
    if (!token) {
      return of(this.decodeProfileFromToken('') as UserProfile);
    }
    return this.http.get<UserProfile>('/api/v1/users/me').pipe(
      catchError(() => {
        const profile = this.decodeProfileFromToken(token);
        return of(profile as UserProfile);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.accessToken;
    if (!token) {
      return false;
    }
    const expiresAt = this.getTokenExpiry(token);
    return expiresAt === null || Date.now() < expiresAt;
  }

  hasRole(role: string): boolean {
    const token = this.accessToken;
    if (!token) {
      return false;
    }
    const roles = this.decodeRoles(token);
    return roles.includes(role);
  }

  private storeTokens(tokens: TokenResponse): void {
    if (tokens.access_token) {
      localStorage.setItem(this.TOKEN_KEY, tokens.access_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem(this.REFRESH_KEY, tokens.refresh_token);
    }
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  private decodeRoles(token: string): string[] {
    const payload = this.decodePayload(token);
    if (!payload) {
      return [];
    }
    const realmAccess = payload['realm_access'];
    if (
      realmAccess &&
      typeof realmAccess === 'object' &&
      Array.isArray((realmAccess as { roles?: unknown }).roles)
    ) {
      return (realmAccess as { roles: string[] }).roles;
    }
    return [];
  }

  private getTokenExpiry(token: string): number | null {
    const payload = this.decodePayload(token);
    if (!payload || typeof payload['exp'] !== 'number') {
      return null;
    }
    return payload['exp'] * 1000;
  }

  private decodePayload(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        return null;
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private decodeProfileFromToken(token: string): Partial<UserProfile> {
    const payload = this.decodePayload(token);
    return {
      email: (payload?.['email'] as string) ?? '',
      displayName: (payload?.['name'] as string) ?? '',
      roles: this.decodeRoles(token),
    };
  }
}