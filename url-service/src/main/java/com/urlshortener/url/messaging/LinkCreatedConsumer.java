package com.urlshortener.url.messaging;

import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.config.datasource.DataSourceContextHolder;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import io.micrometer.core.instrument.Counter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class LinkCreatedConsumer {

    private static final String DEDUP_PREFIX = "link:created:dedup:";

    private final ShortUrlRepository shortUrlRepository;
    private final BloomFilterService bloomFilterService;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, LinkCreatedEvent> kafkaTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Counter urlCreateCounter;

    @Value("${app.kafka.link-created-dlq-topic:link-created-dlq}")
    private String dlqTopic;

    @Value("${app.kafka.consumer.batch-size:500}")
    private int batchSize;

    @Value("${app.kafka.consumer.max-wait-ms:200}")
    private long maxWaitMs;

    @Value("${app.kafka.consumer.idempotency-ttl-hours:24}")
    private long idempotencyTtlHours;

    private final ConcurrentLinkedQueue<LinkCreatedEvent> buffer = new ConcurrentLinkedQueue<>();
    private final AtomicInteger bufferSize = new AtomicInteger(0);
    private final ReentrantLock flushLock = new ReentrantLock();
    private volatile Instant lastFlushTime = Instant.now();

    @KafkaListener(topics = "${app.kafka.link-created-topic:link-created-events}",
            groupId = "${spring.kafka.consumer.group-id}",
            batch = "true",
            containerFactory = "batchKafkaListenerContainerFactory")
    public void onBatch(List<org.apache.kafka.clients.consumer.ConsumerRecord<String, LinkCreatedEvent>> records,
                        Acknowledgment acknowledgment) {
        try {
            for (var record : records) {
                LinkCreatedEvent event = record.value();
                if (event == null) {
                    log.warn("Received null link-created event, key={}", record.key());
                    continue;
                }
                buffer.add(event);
                bufferSize.incrementAndGet();
            }
            flushIfNeeded();
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Error buffering link-created batch: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedDelayString = "${app.kafka.consumer.max-wait-ms:200}")
    public void scheduledFlush() {
        flushIfNeeded();
    }

    private void flushIfNeeded() {
        if (bufferSize.get() == 0) {
            return;
        }
        boolean shouldFlush = bufferSize.get() >= batchSize
                || Duration.between(lastFlushTime, Instant.now()).toMillis() >= maxWaitMs;

        if (!shouldFlush) {
            return;
        }

        flush();
    }

    private void flush() {
        if (!flushLock.tryLock()) {
            return;
        }

        try {
            List<LinkCreatedEvent> drain = new ArrayList<>(bufferSize.get());
            LinkCreatedEvent event;
            while ((event = buffer.poll()) != null) {
                drain.add(event);
            }
            bufferSize.addAndGet(-drain.size());
            lastFlushTime = Instant.now();

            if (drain.isEmpty()) {
                return;
            }

            persistBatch(drain);
        } finally {
            flushLock.unlock();
        }
    }

    private void persistBatch(List<LinkCreatedEvent> events) {
        List<ShortUrl> toSave = new ArrayList<>(events.size());
        List<LinkCreatedEvent> accepted = new ArrayList<>(events.size());

        for (LinkCreatedEvent event : events) {
            if (isDuplicate(event.getIdempotencyKey())) {
                log.debug("Skipping duplicate link-created event, idempotencyKey={}", event.getIdempotencyKey());
                continue;
            }

            ShortUrl shortUrl = ShortUrl.builder()
                    .shortCode(event.getShortCode())
                    .originalUrl(event.getOriginalUrl())
                    .customAlias(event.getCustomAlias())
                    .ownerId(event.getOwnerId())
                    .active(event.isActive())
                    .createdAt(event.getCreatedAt())
                    .expiresAt(event.getExpiresAt())
                    .build();

            toSave.add(shortUrl);
            accepted.add(event);
        }

        if (toSave.isEmpty()) {
            return;
        }

        DataSourceContextHolder.setLeader();
        try {
            boolean success;
            try {
                transactionTemplate.executeWithoutResult(status ->
                        shortUrlRepository.saveAll(toSave));
                success = true;
            } catch (Exception e) {
                success = false;
                log.error("Batch save failed for {} events, falling back to per-row: {}",
                        toSave.size(), e.getMessage());
                handlePartialFailures(toSave, accepted);
            }

            if (success) {
                List<String> codes = new ArrayList<>(accepted.size());
                for (LinkCreatedEvent event : accepted) {
                    codes.add(event.getShortCode());
                    markProcessed(event.getIdempotencyKey());
                    urlCreateCounter.increment();
                }
                bloomFilterService.putAll(new java.util.HashSet<>(codes));
                log.info("Persisted {} link-created events in batch", accepted.size());
            }
        } finally {
            DataSourceContextHolder.clear();
        }
    }

    private void handlePartialFailures(List<ShortUrl> toSave, List<LinkCreatedEvent> accepted) {
        List<String> persistedCodes = new ArrayList<>();
        for (int i = 0; i < toSave.size(); i++) {
            ShortUrl shortUrl = toSave.get(i);
            LinkCreatedEvent event = accepted.get(i);
            try {
                transactionTemplate.executeWithoutResult(status ->
                        shortUrlRepository.saveAndFlush(shortUrl));
                markProcessed(event.getIdempotencyKey());
                urlCreateCounter.increment();
                persistedCodes.add(shortUrl.getShortCode());
                log.debug("Recovered individual link-created event, code={}", event.getShortCode());
            } catch (Exception e) {
                log.error("Failed to persist link-created event {}, code={}, sending to DLQ: {}",
                        event.getIdempotencyKey(), event.getShortCode(), e.getMessage());
                publishToDlq(event, e.getMessage());
            }
        }

        if (!persistedCodes.isEmpty()) {
            bloomFilterService.putAll(new java.util.HashSet<>(persistedCodes));
        }
    }

    private boolean isDuplicate(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.hasKey(DEDUP_PREFIX + idempotencyKey));
    }

    private void markProcessed(String idempotencyKey) {
        redisTemplate.opsForValue().set(
                DEDUP_PREFIX + idempotencyKey, "1",
                Duration.ofHours(idempotencyTtlHours));
    }

    private void publishToDlq(LinkCreatedEvent event, String errorMessage) {
        LinkCreatedEvent dead = LinkCreatedEvent.builder()
                .idempotencyKey(event.getIdempotencyKey())
                .shortCode(event.getShortCode())
                .originalUrl(event.getOriginalUrl())
                .customAlias(event.getCustomAlias())
                .ownerId(event.getOwnerId())
                .active(event.isActive())
                .expiresAt(event.getExpiresAt())
                .createdAt(event.getCreatedAt())
                .build();

        try {
            kafkaTemplate.send(dlqTopic, event.getShortCode(), dead).whenComplete((result, throwable) -> {
                if (throwable != null) {
                    log.error("Failed to publish to DLQ, code={}: {}",
                            event.getShortCode(), throwable.getMessage());
                } else {
                    log.info("Published link-created event to DLQ, code={}, error={}",
                            event.getShortCode(), errorMessage);
                }
            });
        } catch (Exception e) {
            log.error("Error publishing to DLQ, code={}: {}", event.getShortCode(), e.getMessage());
        }
    }
}
