package com.urlshortener.url.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.url.config.datasource.DataSourceContextHolder;
import com.urlshortener.url.model.ClickEvent;
import com.urlshortener.url.repository.ClickEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClickEventPublisherTest {

    @Mock
    private SqsAsyncClient sqsAsyncClient;

    @Mock
    private ClickEventRepository clickEventRepository;

    private ObjectMapper objectMapper;

    private ClickEventPublisher publisher;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        publisher = new ClickEventPublisher(sqsAsyncClient, clickEventRepository, objectMapper);
        DataSourceContextHolder.clear();
    }

    @Test
    void publishClickEventPersistsAndSends() {
        when(sqsAsyncClient.sendMessage(any(SendMessageRequest.class)))
                .thenReturn(CompletableFuture.completedFuture(SendMessageResponse.builder().build()));

        publisher.publishClickEvent("abc1234", "1.2.3.4", "Mozilla", "https://ref.com");

        verify(clickEventRepository).save(any(ClickEvent.class));
        verify(sqsAsyncClient).sendMessage(any(SendMessageRequest.class));
        assertNull(DataSourceContextHolder.get());
    }

    @Test
    void publishClickEventHandlesNullMetadata() {
        when(sqsAsyncClient.sendMessage(any(SendMessageRequest.class)))
                .thenReturn(CompletableFuture.completedFuture(SendMessageResponse.builder().build()));

        publisher.publishClickEvent("abc1234", null, null, null);

        verify(clickEventRepository).save(any(ClickEvent.class));
        assertNull(DataSourceContextHolder.get());
    }

    @Test
    void publishClickEventSqsFailureDoesNotThrow() {
        CompletableFuture<SendMessageResponse> future = new CompletableFuture<>();
        future.completeExceptionally(new RuntimeException("sqs down"));
        when(sqsAsyncClient.sendMessage(any(SendMessageRequest.class))).thenReturn(future);

        assertDoesNotThrow(() -> publisher.publishClickEvent("abc1234", "1.2.3.4", "Mozilla", "ref"));

        verify(sqsAsyncClient).sendMessage(any(SendMessageRequest.class));
        assertNull(DataSourceContextHolder.get());
    }

    @Test
    void publishClickEventClearsContextOnPersistenceFailure() {
        doThrow(new RuntimeException("db down")).when(clickEventRepository).save(any(ClickEvent.class));

        assertDoesNotThrow(() -> publisher.publishClickEvent("abc1234", "1.2.3.4", "Mozilla", "ref"));

        verify(sqsAsyncClient, never()).sendMessage(any(SendMessageRequest.class));
        assertNull(DataSourceContextHolder.get());
    }
}
