import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  AliasCheckResponse,
  ApiResponse,
  CreateLinkPayload,
  CursorPage,
  Page,
  ShortLink,
  UpdateLinkPayload,
} from '../../shared/models/link.model';
import { LinkApiService } from './link-api.service';

describe('LinkApiService', () => {
  let service: LinkApiService;
  let httpMock: HttpTestingController;

  const link: ShortLink = {
    id: 1,
    shortCode: 'abc123',
    shortUrl: 'http://localhost:8080/s/abc123',
    originalUrl: 'https://example.com/long',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 5,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LinkApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a link with an idempotency key header', () => {
    const payload: CreateLinkPayload = {
      url: 'https://example.com/long',
      customAlias: 'custom',
    };
    const response: ApiResponse<ShortLink> = { success: true, data: link };

    service.createLink(payload).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    const idemKey = req.request.headers.get('Idempotency-Key');
    expect(idemKey).toBeTruthy();
    expect(idemKey).toMatch(/^[0-9a-f]{32}$/);
    req.flush(response);
  });

  it('fetches a single link by code', () => {
    const response: ApiResponse<ShortLink> = { success: true, data: link };

    service.getLink('abc123').subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links/abc123/details');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('fetches the user links page with page and size params', () => {
    const page: Page<ShortLink> = {
      content: [link],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    const response: ApiResponse<Page<ShortLink>> = { success: true, data: page };

    service.getUserLinks(2, 50).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/links/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    req.flush(response);
  });

  it('fetches cursor-paged links without a cursor', () => {
    const page: CursorPage<ShortLink> = { data: [link], hasMore: false, size: 20 };
    const response: ApiResponse<CursorPage<ShortLink>> = { success: true, data: page };

    service.getUserLinksCursor().subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/links/me/cursor');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('cursor')).toBeFalse();
    expect(req.request.params.get('size')).toBe('20');
    req.flush(response);
  });

  it('fetches cursor-paged links with a cursor', () => {
    const page: CursorPage<ShortLink> = { data: [link], nextCursor: 'page-2', hasMore: true, size: 20 };
    const response: ApiResponse<CursorPage<ShortLink>> = { success: true, data: page };

    service.getUserLinksCursor('page-1', 10).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links/me/cursor?size=10&cursor=page-1');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('deactivates a link', () => {
    const response: ApiResponse<void> = { success: true, data: undefined };

    service.deactivateLink('abc123').subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links/abc123');
    expect(req.request.method).toBe('DELETE');
    req.flush(response);
  });

  it('updates a link patch', () => {
    const patch: UpdateLinkPayload = { customAlias: 'new-alias' };
    const updated = { ...link, customAlias: 'new-alias' };
    const response: ApiResponse<ShortLink> = { success: true, data: updated };

    service.updateLink('abc123', patch).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links/abc123');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush(response);
  });

  it('checks alias availability', () => {
    const data: AliasCheckResponse = { alias: 'my-alias', available: true };
    const response: ApiResponse<AliasCheckResponse> = { success: true, data };

    service.checkAlias('my-alias').subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne('/api/v1/links/my-alias/exists');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});