package com.urlshortener.url.dto;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class CreateLinkRequestTest {

    @Test
    void builderAndGetters() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("my-alias")
                .expiresAt(now)
                .build();

        assertEquals("https://example.com", request.getUrl());
        assertEquals("my-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
    }

    @Test
    void settersUpdateFields() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        CreateLinkRequest request = new CreateLinkRequest();
        request.setUrl("https://other.com");
        request.setCustomAlias("other-alias");
        request.setExpiresAt(now);

        assertEquals("https://other.com", request.getUrl());
        assertEquals("other-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
    }

    @Test
    void allArgsConstructor() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        CreateLinkRequest request = new CreateLinkRequest("https://example.com", "my-alias", now, "idem-123");

        assertEquals("https://example.com", request.getUrl());
        assertEquals("my-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
        assertEquals("idem-123", request.getIdempotencyKey());
    }

    @Test
    void equalsHashCodeAndToString() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        CreateLinkRequest a = CreateLinkRequest.builder().url("https://a.com").customAlias("x").expiresAt(now).build();
        CreateLinkRequest b = CreateLinkRequest.builder().url("https://a.com").customAlias("x").expiresAt(now).build();
        CreateLinkRequest c = CreateLinkRequest.builder().url("https://b.com").customAlias("x").expiresAt(now).build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "x");
        assertTrue(a.toString().contains("a.com"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }
}
