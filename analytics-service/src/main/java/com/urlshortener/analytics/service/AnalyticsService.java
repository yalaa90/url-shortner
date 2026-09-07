package com.urlshortener.analytics.service;

import com.urlshortener.analytics.dto.AnalyticsResponse;
import com.urlshortener.analytics.model.HourlyRollup;
import com.urlshortener.analytics.repository.DailyCompactionRepository;
import com.urlshortener.analytics.repository.HourlyRollupRepository;
import com.urlshortener.analytics.repository.RawClickEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final RawClickEventRepository rawClickEventRepository;
    private final HourlyRollupRepository hourlyRollupRepository;
    private final DailyCompactionRepository dailyCompactionRepository;

    @Cacheable(value = "analytics", key = "#code", unless = "#result == null")
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String code, int days) {
        Instant now = Instant.now();
        Instant from = now.minus(days, ChronoUnit.DAYS);

        long totalClicks;
        long uniqueVisitors;
        List<HourlyRollup> rollups = hourlyRollupRepository
                .findByShortCodeAndBucketStartBetweenOrderByBucketStartAsc(code, from, now);

        if (rollups.isEmpty()) {
            totalClicks = rawClickEventRepository.countByShortCodeAndCreatedAtBetween(code, from, now);
            uniqueVisitors = rawClickEventRepository.countUniqueVisitors(code, from, now);
        } else {
            totalClicks = rollups.stream()
                    .mapToLong(HourlyRollup::getClickCount).sum();
            uniqueVisitors = rollups.stream()
                    .mapToLong(HourlyRollup::getUniqueVisitors).sum();
        }

        long dailyTotal = dailyCompactionRepository.totalClicks(code, from, now);
        if (dailyTotal > 0) {
            totalClicks = Math.max(totalClicks, dailyTotal);
        }

        Map<String, Long> referrers = topReferrers(code, from, now);
        Map<String, Long> countries = topCountries(code, from, now);
        List<AnalyticsResponse.TimeSeriesPoint> timeSeries = timeSeries(code, from, now);

        return AnalyticsResponse.builder()
                .shortCode(code)
                .totalClicks(totalClicks)
                .uniqueVisitors(uniqueVisitors)
                .referrers(referrers)
                .countries(countries)
                .timeSeries(timeSeries)
                .build();
    }

    private Map<String, Long> topReferrers(String code, Instant from, Instant to) {
        return rawClickEventRepository.topReferrers(code, from, to, PageRequest.of(0, 10)).stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        Math::addExact,
                        LinkedHashMap::new));
    }

    private Map<String, Long> topCountries(String code, Instant from, Instant to) {
        return rawClickEventRepository.topCountries(code, from, to, PageRequest.of(0, 10)).stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        Math::addExact,
                        LinkedHashMap::new));
    }

    private List<AnalyticsResponse.TimeSeriesPoint> timeSeries(String code, Instant from, Instant to) {
        List<HourlyRollup> rollups = hourlyRollupRepository
                .findByShortCodeAndBucketStartBetweenOrderByBucketStartAsc(code, from, to);

        if (!rollups.isEmpty()) {
            return rollups.stream()
                    .map(r -> AnalyticsResponse.TimeSeriesPoint.builder()
                            .timestamp(r.getBucketStart())
                            .clicks(r.getClickCount())
                            .build())
                    .toList();
        }

        return rawClickEventRepository.hourlySeries(code, from, to).stream()
                .map(row -> AnalyticsResponse.TimeSeriesPoint.builder()
                        .timestamp((Instant) row[0])
                        .clicks((Long) row[1])
                        .build())
                .toList();
    }
}