import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiResponse } from '@shared-lib';

export interface TimeSeriesPoint {
  timestamp: string;
  clicks: number;
}

export interface AnalyticsSummary {
  shortCode: string;
  totalClicks: number;
  uniqueVisitors: number;
  referrers: Record<string, number>;
  countries: Record<string, number>;
  timeSeries: TimeSeriesPoint[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly baseUrl = '/api/v1/analytics';

  constructor(private readonly http: HttpClient) {}

  getAnalytics(code: string, days = 30): Observable<ApiResponse<AnalyticsSummary>> {
    const params = new HttpParams().set('days', days);
    return this.http
      .get<ApiResponse<AnalyticsSummary>>(`${this.baseUrl}/${code}`, { params })
      .pipe(shareReplay(1));
  }
}