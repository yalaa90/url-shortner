package com.urlshortener.url.encoding;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SnowflakeIdGenerator {

    private static final long CUSTOM_EPOCH = 1704067200000L; // 2024-01-01T00:00:00Z

    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;
    private static final long MAX_WORKER_ID = (1L << WORKER_ID_BITS) - 1; // 1023
    private static final long MAX_SEQUENCE = (1L << SEQUENCE_BITS) - 1;   // 4095

    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

    private final StringRedisTemplate redisTemplate;

    @Value("${app.url.snowflake.worker-id-key:url:snowflake:worker-id}")
    private String workerIdKey;

    @Value("${app.url.snowflake.max-worker-id:1023}")
    private long maxWorkerId;

    private long workerId;
    private long lastTimestamp = -1L;
    private long sequence = 0L;

    @PostConstruct
    public void init() {
        this.maxWorkerId = Math.min(this.maxWorkerId, MAX_WORKER_ID);
        this.workerId = Math.floorMod(
                redisTemplate.opsForValue().increment(workerIdKey),
                maxWorkerId + 1
        );
        log.info("Snowflake worker initialized: id={}, using redis key={}", workerId, workerIdKey);
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();

        if (timestamp < lastTimestamp) {
            log.warn("Clock moved backwards; waiting {} ms", lastTimestamp - timestamp);
            java.util.concurrent.locks.LockSupport.parkNanos(
                    (lastTimestamp - timestamp) * 1_000_000L);
            timestamp = System.currentTimeMillis();
        }

        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) {
                timestamp = waitForNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - CUSTOM_EPOCH) << TIMESTAMP_SHIFT)
                | (workerId << WORKER_ID_SHIFT)
                | sequence;
    }

    private long waitForNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }

    public long getWorkerId() {
        return workerId;
    }
}
