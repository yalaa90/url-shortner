package com.urlshortener.url.mapper;

import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.model.ShortUrl;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LinkMapperTest {

    private final LinkMapper mapper = new LinkMapperImpl();

    private final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void mapShortUrlDefaultReturnsNull() {
        assertNull(mapper.mapShortUrl(new ShortUrl()));
    }

    @Test
    void toResponseUsesEffectiveCode() {
        ShortUrl url = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .customAlias("my-alias")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        LinkResponse response = mapper.toResponse(url);

        assertEquals("my-alias", response.getShortCode());
        assertEquals("https://example.com", response.getOriginalUrl());
        assertNull(response.getShortUrl());
        assertEquals(0, response.getClickCount());
        assertTrue(response.isActive());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void toResponseFallsBackToShortCode() {
        ShortUrl url = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        LinkResponse response = mapper.toResponse(url);

        assertEquals("abc1234", response.getShortCode());
    }

    @Test
    void toEntityMapsRequest() {
        Instant expiresAt = Instant.now().plusSeconds(3600);
        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("my-alias")
                .expiresAt(expiresAt)
                .build();

        ShortUrl url = mapper.toEntity(request);

        assertEquals("my-alias", url.getCustomAlias());
        assertEquals(expiresAt, url.getExpiresAt());
        assertNull(url.getId());
        assertNull(url.getShortCode());
        assertNull(url.getOwnerId());
    }
}
