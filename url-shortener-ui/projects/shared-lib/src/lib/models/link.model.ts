export interface ShortLink {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  clickCount: number;
}

export interface CreateLinkPayload {
  url: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface UpdateLinkPayload {
  customAlias?: string;
  expiresAt?: string;
}

export interface AliasCheckResponse {
  alias: string;
  available: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  correlationId?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  size: number;
}
