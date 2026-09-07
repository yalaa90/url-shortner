import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import {
  AliasCheckResponse,
  ApiResponse,
  CursorPage,
  CreateLinkPayload,
  Page,
  ShortLink,
  UpdateLinkPayload,
} from '../../shared/models/link.model';

@Injectable({ providedIn: 'root' })
export class LinkApiService {
  private readonly baseUrl = '/api/v1/links';

  constructor(private readonly http: HttpClient) {}

  createLink(payload: CreateLinkPayload): Observable<ApiResponse<ShortLink>> {
    return this.http.post<ApiResponse<ShortLink>>(this.baseUrl, payload, {
      headers: { 'Idempotency-Key': this.generateIdempotencyKey() },
    });
  }

  getLink(code: string): Observable<ApiResponse<ShortLink>> {
    return this.http
      .get<ApiResponse<ShortLink>>(`${this.baseUrl}/${code}/details`)
      .pipe(shareReplay(1));
  }

  getUserLinks(page = 0, size = 20): Observable<ApiResponse<Page<ShortLink>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<Page<ShortLink>>>(`${this.baseUrl}/me`, { params })
      .pipe(shareReplay(1));
  }

  getUserLinksCursor(cursor?: string, size = 20): Observable<ApiResponse<CursorPage<ShortLink>>> {
    let params = new HttpParams().set('size', size);
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<ApiResponse<CursorPage<ShortLink>>>(`${this.baseUrl}/me/cursor`, { params });
  }

  deactivateLink(code: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${code}`);
  }

  updateLink(code: string, payload: UpdateLinkPayload): Observable<ApiResponse<ShortLink>> {
    return this.http.patch<ApiResponse<ShortLink>>(`${this.baseUrl}/${code}`, payload);
  }

  checkAlias(alias: string): Observable<ApiResponse<AliasCheckResponse>> {
    return this.http.get<ApiResponse<AliasCheckResponse>>(
      `${this.baseUrl}/${encodeURIComponent(alias)}/exists`
    );
  }

  private generateIdempotencyKey(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}