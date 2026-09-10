package com.urlshortener.analytics.batch;

import com.urlshortener.analytics.repository.RawClickEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class HourlyAggregationJob {

    private final RawClickEventRepository rawClickEventRepository;
    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "5 0 * * * *", zone = "UTC")
    @Transactional
    public void aggregateHourly() {
        Instant end = Instant.now().truncatedTo(ChronoUnit.HOURS);
        Instant start = end.minus(1, ChronoUnit.HOURS);
        log.info("Aggregating hourly rollups for {}-{}", start, end);

        List<String> codes = rawClickEventRepository
                .findAll(org.springframework.data.domain.Pageable.unpaged())
                .stream().map(event -> event.getShortCode())
                .distinct()
                .toList();

        for (String code : codes) {
            long clicks = rawClickEventRepository
                    .countByShortCodeAndCreatedAtBetween(code, start, end);
            if (clicks == 0) {
                continue;
            }

            jdbcTemplate.update("""
                    INSERT INTO hourly_rollups (id, short_code, bucket_start, click_count, unique_visitors)
                    VALUES (gen_random_uuid(), ?, ?, ?, 0)
                    ON CONFLICT (short_code, bucket_start) DO UPDATE SET click_count = EXCLUDED.click_count
                    """, code, start, clicks);
        }

        log.info("Hourly aggregation complete for {} codes", codes.size());
    }

    @Scheduled(cron = "15 0 0 * * *", zone = "UTC")
    public void compactDaily() {
        Instant end = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant start = end.minus(1, ChronoUnit.DAYS);
        log.info("Compacting daily rollups for {}-{}", start, end);

        jdbcTemplate.update("""
                INSERT INTO daily_compactions (id, short_code, bucket_start, click_count, unique_visitors)
                SELECT gen_random_uuid(), short_code, DATE_TRUNC('day', bucket_start), SUM(click_count), SUM(unique_visitors)
                FROM hourly_rollups
                WHERE bucket_start BETWEEN ? AND ?
                GROUP BY short_code, DATE_TRUNC('day', bucket_start)
                ON CONFLICT (short_code, bucket_start) DO UPDATE SET click_count = EXCLUDED.click_count
                """, start, end);

        log.info("Daily compaction complete");
    }
}