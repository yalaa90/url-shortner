package com.urlshortener.url.dto;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class LinkResponseTest {

    @Test
    void builderAndGetters() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        LinkResponse response = LinkResponse.builder()
                .id(1L)
                .shortCode("abc1234")
                .shortUrl("http://localhost:8080/abc1234")
                .originalUrl("https://example.com")
                .customAlias("my-alias")
                .active(true)
                .createdAt(now)
                .expiresAt(now.plusSeconds(3600))
                .clickCount(5L)
                .build();

        assertEquals(1L, response.getId());
        assertEquals("abc1234", response.getShortCode());
        assertEquals("http://localhost:8080/abc1234", response.getShortUrl());
        assertEquals("https://example.com", response.getOriginalUrl());
        assertEquals("my-alias", response.getCustomAlias());
        assertTrue(response.isActive());
        assertEquals(now, response.getCreatedAt());
        assertEquals(now.plusSeconds(3600), response.getExpiresAt());
        assertEquals(5L, response.getClickCount());
    }

    @Test
    void settersUpdateFields() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        LinkResponse response = new LinkResponse();
        response.setId(2L);
        response.setShortCode("def5678");
        response.setShortUrl("http://localhost:8080/def5678");
        response.setOriginalUrl("https://other.com");
        response.setCustomAlias("other-alias");
        response.setActive(false);
        response.setCreatedAt(now);
        response.setExpiresAt(now.plusSeconds(60));
        response.setClickCount(9L);

        assertEquals(2L, response.getId());
        assertEquals("def5678", response.getShortCode());
        assertEquals("http://localhost:8080/def5678", response.getShortUrl());
        assertEquals("https://other.com", response.getOriginalUrl());
        assertEquals("other-alias", response.getCustomAlias());
        assertFalse(response.isActive());
        assertEquals(now, response.getCreatedAt());
        assertEquals(now.plusSeconds(60), response.getExpiresAt());
        assertEquals(9L, response.getClickCount());
    }

    @Test
    void allArgsConstructor() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        LinkResponse response = new LinkResponse(1L, "abc1234", "http://l/abc1234",
                "https://example.com", "my-alias", true, now, now.plusSeconds(10), 3L);

        assertEquals(1L, response.getId());
        assertEquals("abc1234", response.getShortCode());
        assertEquals("my-alias", response.getCustomAlias());
        assertTrue(response.isActive());
        assertEquals(3L, response.getClickCount());
    }

    @Test
    void equalsHashCodeAndToString() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        LinkResponse a = LinkResponse.builder()
                .id(1L).shortCode("abc").originalUrl("https://example.com")
                .active(true).createdAt(now).build();
        LinkResponse b = LinkResponse.builder()
                .id(1L).shortCode("abc").originalUrl("https://example.com")
                .active(true).createdAt(now).build();
        LinkResponse c = LinkResponse.builder()
                .id(2L).shortCode("abc").originalUrl("https://example.com")
                .active(true).createdAt(now).build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "not-a-response");
        assertTrue(a.toString().contains("abc"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }
}
