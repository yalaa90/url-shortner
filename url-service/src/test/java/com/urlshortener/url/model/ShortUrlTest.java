package com.urlshortener.url.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ShortUrlTest {

    private final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void prePersistSetsCreatedAtAndForcesActive() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(false)
                .build();

        url.onCreate();

        assertNotNull(url.getCreatedAt());
        assertTrue(url.isActive());
    }

    @Test
    void getEffectiveCodePrefersCustomAlias() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .customAlias("my-alias")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        assertEquals("my-alias", url.getEffectiveCode());
    }

    @Test
    void getEffectiveCodeFallsBackToShortCode() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        assertEquals("abc1234", url.getEffectiveCode());
    }

    @Test
    void isExpiredTrueWhenPastExpiry() {
        ShortUrl url = ShortUrl.builder()
                .expiresAt(Instant.now().minusSeconds(60))
                .build();

        assertTrue(url.isExpired());
    }

    @Test
    void isExpiredFalseWhenNotExpired() {
        ShortUrl url = ShortUrl.builder()
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        assertFalse(url.isExpired());
    }

    @Test
    void isExpiredFalseWhenNoExpiry() {
        ShortUrl url = ShortUrl.builder().build();

        assertFalse(url.isExpired());
    }

    @Test
    void isActiveAndValidRequiresActiveAndNotExpired() {
        ShortUrl activeValid = ShortUrl.builder()
                .active(true)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        ShortUrl inactive = ShortUrl.builder()
                .active(false)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        ShortUrl expired = ShortUrl.builder()
                .active(true)
                .expiresAt(Instant.now().minusSeconds(60))
                .build();

        assertTrue(activeValid.isActiveAndValid());
        assertFalse(inactive.isActiveAndValid());
        assertFalse(expired.isActiveAndValid());
    }

    @Test
    void allArgsConstructor() {
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");
        ShortUrl url = new ShortUrl(1L, "abc1234", "https://example.com", "my-alias",
                OWNER_ID, true, createdAt, null, null, "encrypted");

        assertEquals(1L, url.getId());
        assertEquals("abc1234", url.getShortCode());
        assertEquals("https://example.com", url.getOriginalUrl());
        assertEquals("my-alias", url.getCustomAlias());
        assertEquals(OWNER_ID, url.getOwnerId());
        assertTrue(url.isActive());
        assertEquals(createdAt, url.getCreatedAt());
        assertNull(url.getExpiresAt());
        assertNull(url.getDeactivatedAt());
        assertEquals("encrypted", url.getEncryptedOriginalUrl());
    }

    @Test
    void settersUpdateFields() {
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");
        Instant expiresAt = createdAt.plusSeconds(60);
        Instant deactivatedAt = createdAt.plusSeconds(120);
        ShortUrl url = new ShortUrl();

        url.setId(2L);
        url.setShortCode("def5678");
        url.setOriginalUrl("https://other.com");
        url.setCustomAlias("x-alias");
        url.setOwnerId(OWNER_ID);
        url.setActive(false);
        url.setCreatedAt(createdAt);
        url.setExpiresAt(expiresAt);
        url.setDeactivatedAt(deactivatedAt);
        url.setEncryptedOriginalUrl("enc-2");

        assertEquals(2L, url.getId());
        assertEquals("def5678", url.getShortCode());
        assertEquals("https://other.com", url.getOriginalUrl());
        assertEquals("x-alias", url.getCustomAlias());
        assertEquals(OWNER_ID, url.getOwnerId());
        assertFalse(url.isActive());
        assertEquals(createdAt, url.getCreatedAt());
        assertEquals(expiresAt, url.getExpiresAt());
        assertEquals(deactivatedAt, url.getDeactivatedAt());
        assertEquals("enc-2", url.getEncryptedOriginalUrl());
    }

    @Test
    void toStringIncludesFields() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .build();

        String str = url.toString();
        assertTrue(str.contains("abc1234"));
        assertTrue(str.contains("https://example.com"));
    }
}
