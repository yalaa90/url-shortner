package com.urlshortener.url.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class LinkEventPublisher {

    private final KafkaTemplate<String, LinkCreatedEvent> kafkaTemplate;

    @Value("${app.kafka.link-created-topic:link-created-events}")
    private String topic;

    public void publishLinkCreated(LinkCreatedEvent event) {
        try {
            CompletableFuture<SendResult<String, LinkCreatedEvent>> future =
                    kafkaTemplate.send(topic, event.getShortCode(), event);

            future.whenComplete((result, throwable) -> {
                if (throwable != null) {
                    log.error("Failed to publish link-created event, code={}, idempotencyKey={}: {}",
                            event.getShortCode(), event.getIdempotencyKey(), throwable.getMessage());
                } else {
                    log.debug("Link-created event published, code={}, partition={}, offset={}",
                            event.getShortCode(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                }
            });
        } catch (Exception ex) {
            log.error("Failed to enqueue link-created event, code={}, idempotencyKey={}: {}",
                    event.getShortCode(), event.getIdempotencyKey(), ex.getMessage());
        }
    }
}
