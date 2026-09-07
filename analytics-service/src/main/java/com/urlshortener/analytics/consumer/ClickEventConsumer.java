package com.urlshortener.analytics.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.analytics.model.RawClickEvent;
import com.urlshortener.analytics.repository.RawClickEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventConsumer {

    private static final String DEDUP_PREFIX = "analytics:dedup:";
    private static final Duration DEDUP_TTL = Duration.ofHours(24);

    private final SqsAsyncClient sqsAsyncClient;
    private final RawClickEventRepository rawClickEventRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.aws.sqs.click-events-queue}")
    private String queueUrl;

    @Scheduled(fixedDelay = 500)
    public void pollMessages() {
        ReceiveMessageRequest request = ReceiveMessageRequest.builder()
                .queueUrl(queueUrl)
                .maxNumberOfMessages(10)
                .waitTimeSeconds(5)
                .build();

        sqsAsyncClient.receiveMessage(request)
                .thenAccept(this::processBatch)
                .exceptionally(throwable -> {
                    log.warn("Error receiving SQS messages: {}", throwable.getMessage());
                    return null;
                });
    }

    private void processBatch(ReceiveMessageResponse response) {
        List<Message> messages = response.messages();
        if (messages.isEmpty()) {
            return;
        }

        messages.forEach(msg -> {
            try {
                boolean processed = processMessage(msg.body());
                if (processed) {
                    deleteMessage(msg.receiptHandle());
                }
            } catch (Exception e) {
                log.error("Failed to process message {}: {}", msg.messageId(), e.getMessage());
            }
        });
    }

    private boolean processMessage(String body) throws Exception {
        JsonNode node = objectMapper.readTree(body);
        String eventId = node.path("eventId").asText();

        if (!isDuplicate(eventId)) {
            markProcessed(eventId);

            RawClickEvent event = RawClickEvent.builder()
                    .eventId(eventId)
                    .shortCode(node.path("shortCode").asText())
                    .ipAddress(node.path("ipAddress").asText())
                    .userAgent(node.path("userAgent").asText())
                    .referrer(node.path("referrer").asText())
                    .createdAt(node.has("timestamp")
                            ? Instant.parse(node.path("timestamp").asText())
                            : Instant.now())
                    .processed(true)
                    .build();

            rawClickEventRepository.save(event);
            log.debug("Persisted click event: {}", eventId);
        }

        return true;
    }

    private boolean isDuplicate(String eventId) {
        if (rawClickEventRepository.existsByEventId(eventId)) {
            return true;
        }
        Boolean seen = redisTemplate.hasKey(DEDUP_PREFIX + eventId);
        return Boolean.TRUE.equals(seen);
    }

    private void markProcessed(String eventId) {
        redisTemplate.opsForValue().set(DEDUP_PREFIX + eventId, "1", DEDUP_TTL);
    }

    private void deleteMessage(String receiptHandle) {
        DeleteMessageRequest request = DeleteMessageRequest.builder()
                .queueUrl(queueUrl)
                .receiptHandle(receiptHandle)
                .build();

        CompletableFuture.runAsync(() -> sqsAsyncClient.deleteMessage(request)
                .exceptionally(throwable -> {
                    log.warn("Failed to delete processed message: {}", throwable.getMessage());
                    return null;
                }));
    }
}