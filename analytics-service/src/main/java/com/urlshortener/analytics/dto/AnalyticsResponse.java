package com.urlshortener.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    private String shortCode;
    private long totalClicks;
    private long uniqueVisitors;
    private Map<String, Long> referrers;
    private Map<String, Long> countries;
    private List<TimeSeriesPoint> timeSeries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesPoint {
        private Instant timestamp;
        private long clicks;
    }
}