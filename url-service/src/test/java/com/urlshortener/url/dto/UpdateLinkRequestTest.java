package com.urlshortener.url.dto;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class UpdateLinkRequestTest {

    @Test
    void builderAndGetters() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        UpdateLinkRequest request = UpdateLinkRequest.builder()
                .customAlias("my-alias")
                .expiresAt(now)
                .build();

        assertEquals("my-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
    }

    @Test
    void settersUpdateFields() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        UpdateLinkRequest request = new UpdateLinkRequest();
        request.setCustomAlias("other-alias");
        request.setExpiresAt(now);

        assertEquals("other-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
    }

    @Test
    void allArgsConstructor() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        UpdateLinkRequest request = new UpdateLinkRequest("my-alias", now);

        assertEquals("my-alias", request.getCustomAlias());
        assertEquals(now, request.getExpiresAt());
    }

    @Test
    void equalsHashCodeAndToString() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        UpdateLinkRequest a = UpdateLinkRequest.builder().customAlias("x").expiresAt(now).build();
        UpdateLinkRequest b = UpdateLinkRequest.builder().customAlias("x").expiresAt(now).build();
        UpdateLinkRequest c = UpdateLinkRequest.builder().customAlias("y").expiresAt(now).build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "x");
        assertTrue(a.toString().contains("x"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }
}
