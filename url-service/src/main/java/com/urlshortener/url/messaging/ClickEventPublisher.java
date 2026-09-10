package com.urlshortener.url.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.url.config.datasource.DataSourceContextHolder;
import com.urlshortener.url.model.ClickEvent;
import com.urlshortener.url.repository.ClickEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventPublisher {

    private final SqsAsyncClient sqsAsyncClient;
    private final ClickEventRepository clickEventRepository;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_URL = System.getenv().getOrDefault("SQS_CLICK_EVENTS_QUEUE",
            "http://localhost:4566/000000000000/click-events");

    @Async
    public void publishClickEvent(String shortCode, String ipAddress, String userAgent, String referrer) {
        String eventId = UUID.randomUUID().toString();

        try {
            // Persist event locally on the leader; runs on an async thread so set the context explicitly.
            DataSourceContextHolder.setLeader();
            ClickEvent event = ClickEvent.builder()
                    .shortCode(shortCode)
                    .eventId(eventId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .referrer(referrer)
                    .createdAt(Instant.now())
                    .build();
            clickEventRepository.save(event);
            DataSourceContextHolder.clear();

            // Send to SQS for analytics service
            Map<String, Object> message = Map.of(
                    "eventId", eventId,
                    "shortCode", shortCode,
                    "ipAddress", ipAddress != null ? ipAddress : "",
                    "userAgent", userAgent != null ? userAgent : "",
                    "referrer", referrer != null ? referrer : "",
                    "timestamp", Instant.now().toString()
            );

            String body = objectMapper.writeValueAsString(message);
            SendMessageRequest sendRequest = SendMessageRequest.builder()
                    .queueUrl(QUEUE_URL)
                    .messageBody(body)
                    .messageGroupId("click-events")
                    .messageDeduplicationId(eventId)
                    .build();

            sqsAsyncClient.sendMessage(sendRequest)
                    .whenComplete((response, throwable) -> {
                        if (throwable != null) {
                            log.error("Failed to publish click event to SQS: {}", throwable.getMessage());
                        } else {
                            log.debug("Click event published: eventId={}, shortCode={}", eventId, shortCode);
                        }
                    });

        } catch (Exception e) {
            DataSourceContextHolder.clear();
            log.error("Error publishing click event: {}", e.getMessage(), e);
        }
    }
}
