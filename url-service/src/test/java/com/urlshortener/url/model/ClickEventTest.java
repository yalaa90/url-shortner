package com.urlshortener.url.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ClickEventTest {

    @Test
    void builderAndGetters() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        ClickEvent event = ClickEvent.builder()
                .id(id)
                .shortCode("abc1234")
                .eventId("event-1")
                .ipAddress("1.2.3.4")
                .userAgent("Mozilla")
                .referrer("https://ref.com")
                .country("US")
                .city("NYC")
                .createdAt(now)
                .build();

        assertEquals(id, event.getId());
        assertEquals("abc1234", event.getShortCode());
        assertEquals("event-1", event.getEventId());
        assertEquals("1.2.3.4", event.getIpAddress());
        assertEquals("Mozilla", event.getUserAgent());
        assertEquals("https://ref.com", event.getReferrer());
        assertEquals("US", event.getCountry());
        assertEquals("NYC", event.getCity());
        assertEquals(now, event.getCreatedAt());
    }

    @Test
    void settersUpdateFields() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        ClickEvent event = new ClickEvent();
        event.setId(id);
        event.setShortCode("def5678");
        event.setEventId("event-2");
        event.setIpAddress("5.6.7.8");
        event.setUserAgent("Chrome");
        event.setReferrer("https://r.com");
        event.setCountry("DE");
        event.setCity("Berlin");
        event.setCreatedAt(now);

        assertEquals(id, event.getId());
        assertEquals("def5678", event.getShortCode());
        assertEquals("event-2", event.getEventId());
        assertEquals("5.6.7.8", event.getIpAddress());
        assertEquals("Chrome", event.getUserAgent());
        assertEquals("https://r.com", event.getReferrer());
        assertEquals("DE", event.getCountry());
        assertEquals("Berlin", event.getCity());
        assertEquals(now, event.getCreatedAt());
    }

    @Test
    void allArgsConstructor() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        ClickEvent event = new ClickEvent(id, "abc1234", "event-3",
                "1.2.3.4", "Mozilla", "ref", "US", "NYC", now);

        assertEquals(id, event.getId());
        assertEquals("abc1234", event.getShortCode());
        assertEquals("US", event.getCountry());
        assertEquals(now, event.getCreatedAt());
    }

    @Test
    void onCreateSetsCreatedAt() {
        ClickEvent event = new ClickEvent();
        event.onCreate();

        assertNotNull(event.getCreatedAt());
    }
}
