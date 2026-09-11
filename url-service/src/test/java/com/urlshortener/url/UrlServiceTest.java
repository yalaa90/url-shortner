package com.urlshortener.url;

import com.urlshortener.exception.ConflictException;
import com.urlshortener.exception.ResourceNotFoundException;
import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.config.UrlConfig;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.UpdateLinkRequest;
import com.urlshortener.url.encoding.Base62Encoder;
import com.urlshortener.url.encoding.SnowflakeIdGenerator;
import com.urlshortener.url.mapper.LinkMapperImpl;
import com.urlshortener.url.messaging.ClickEventPublisher;
import com.urlshortener.url.messaging.LinkCreatedEvent;
import com.urlshortener.url.messaging.LinkEventPublisher;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import com.urlshortener.url.service.UrlResolutionService;
import com.urlshortener.url.service.UrlService;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock private ShortUrlRepository shortUrlRepository;
    @Mock private SnowflakeIdGenerator snowflakeIdGenerator;
    @Mock private BloomFilterService bloomFilterService;
    @Mock private CacheService cacheService;
    @Mock private UrlResolutionService urlResolutionService;
    @Mock private ClickEventPublisher clickEventPublisher;
    @Mock private LinkEventPublisher linkEventPublisher;
    @Mock private UrlConfig urlConfig;

    private UrlService urlService;
    private SimpleMeterRegistry meterRegistry;

    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        Timer redirectTimer = Timer.builder("url.redirect.duration").register(meterRegistry);

        urlService = new UrlService(
                shortUrlRepository,
                new Base62Encoder(),
                snowflakeIdGenerator,
                bloomFilterService,
                cacheService,
                urlResolutionService,
                new LinkMapperImpl(),
                clickEventPublisher,
                linkEventPublisher,
                redirectTimer,
                urlConfig
        );
    }

    @Test
    void createLinkWithGeneratedCode() {
        when(snowflakeIdGenerator.nextId()).thenReturn(1L);
        when(urlConfig.getBaseUrl()).thenReturn("http://localhost:8080");

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com/very/very/long/path?with=query&params=true")
                .build();

        var response = urlService.createLink(request, OWNER_ID);

        assertNotNull(response);
        assertNotNull(response.getShortCode());
        assertEquals("https://example.com/very/very/long/path?with=query&params=true",
                response.getOriginalUrl());
        assertTrue(response.getShortUrl().startsWith("http://localhost:8080/"));

        ArgumentCaptor<LinkCreatedEvent> captor = ArgumentCaptor.forClass(LinkCreatedEvent.class);
        verify(linkEventPublisher).publishLinkCreated(captor.capture());
        assertEquals(response.getShortCode(), captor.getValue().getShortCode());
        assertEquals(OWNER_ID, captor.getValue().getOwnerId());
        assertNotNull(captor.getValue().getIdempotencyKey());

        verify(shortUrlRepository, never()).save(any(ShortUrl.class));
        verify(bloomFilterService).put(response.getShortCode());
    }

    @Test
    void createLinkWithCustomAlias() {
        when(shortUrlRepository.existsByCustomAlias("my-alias")).thenReturn(false);
        when(shortUrlRepository.existsByShortCode("my-alias")).thenReturn(false);
        when(urlConfig.getBaseUrl()).thenReturn("http://localhost:8080");

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("my-alias")
                .build();

        var response = urlService.createLink(request, OWNER_ID);

        assertEquals("my-alias", response.getShortCode());
        assertFalse(response.getShortUrl().contains("abc"));

        ArgumentCaptor<LinkCreatedEvent> captor = ArgumentCaptor.forClass(LinkCreatedEvent.class);
        verify(linkEventPublisher).publishLinkCreated(captor.capture());
        assertEquals("my-alias", captor.getValue().getShortCode());
        assertEquals("my-alias", captor.getValue().getCustomAlias());
        verify(shortUrlRepository, never()).save(any(ShortUrl.class));
    }

    @Test
    void createLinkWithTakenAliasThrows() {
        when(shortUrlRepository.existsByCustomAlias("taken")).thenReturn(true);

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("taken")
                .build();

        assertThrows(ConflictException.class, () -> urlService.createLink(request, OWNER_ID));
        verify(linkEventPublisher, never()).publishLinkCreated(any());
    }

    @Test
    void redirectAndTrackReturnsOriginalUrl() {
        when(urlResolutionService.resolveRedirectUrl("abc1234"))
                .thenReturn(Optional.of("https://example.com"));

        String result = urlService.redirectAndTrack("abc1234", "192.168.1.1", "Mozilla", "google.com");

        assertEquals("https://example.com", result);
        verify(clickEventPublisher).publishClickEvent(eq("abc1234"), eq("192.168.1.1"),
                eq("Mozilla"), eq("google.com"));
    }

    @Test
    void redirectAndTrackThrowsForUnknown() {
        when(urlResolutionService.resolveRedirectUrl("nope"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> urlService.redirectAndTrack("nope", null, null, null));
    }

    @Test
    void deactivateLinkValidatesOwnership() {
        ShortUrl shortUrl = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(shortUrl));

        UUID otherOwner = UUID.fromString("00000000-0000-0000-0000-000000000002");
        assertThrows(ConflictException.class,
                () -> urlService.deactivateLink("abc1234", otherOwner));
    }

    @Test
    void aliasAvailabilityCheck() {
        when(shortUrlRepository.existsByCustomAlias("free123")).thenReturn(false);
        when(shortUrlRepository.existsByShortCode("free123")).thenReturn(false);

        assertTrue(urlService.isAliasAvailable("free123"));
    }

    @Test
    void getLinkReturnsDetails() {
        ShortUrl shortUrl = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(shortUrl));

        var response = urlService.getLink("abc1234");

        assertNotNull(response);
        assertEquals("abc1234", response.getShortCode());
        assertEquals("https://example.com", response.getOriginalUrl());
    }

    private ShortUrl shortUrl(String code, String alias) {
        return ShortUrl.builder()
                .id(1L)
                .shortCode(code)
                .customAlias(alias)
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void getLinkThrowsWhenNotFound() {
        when(shortUrlRepository.findByShortCodeOrCustomAlias("nope", "nope")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> urlService.getLink("nope"));
    }

    @Test
    void updateLinkUpdatesAlias() {
        ShortUrl url = shortUrl("abc1234", null);
        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(url));
        when(shortUrlRepository.existsByCustomAlias("new-alias")).thenReturn(false);
        when(shortUrlRepository.updateCustomAlias("abc1234", "new-alias")).thenReturn(1);
        when(urlConfig.getBaseUrl()).thenReturn("http://localhost:8080");

        UpdateLinkRequest request = UpdateLinkRequest.builder().customAlias("new-alias").build();
        var response = urlService.updateLink("abc1234", request, OWNER_ID);

        assertEquals("new-alias", response.getShortCode());
        assertEquals("new-alias", url.getCustomAlias());
    }

    @Test
    void updateLinkUpdatesExpiration() {
        ShortUrl url = shortUrl("abc1234", null);
        Instant newExpiry = Instant.now().plusSeconds(3600);
        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(url));
        when(urlConfig.getBaseUrl()).thenReturn("http://localhost:8080");

        UpdateLinkRequest request = UpdateLinkRequest.builder().expiresAt(newExpiry).build();
        var response = urlService.updateLink("abc1234", request, OWNER_ID);

        assertEquals(newExpiry, url.getExpiresAt());
        assertNotNull(response);
    }

    @Test
    void updateLinkThrowsWhenAliasTaken() {
        ShortUrl url = shortUrl("abc1234", null);
        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(url));
        when(shortUrlRepository.existsByCustomAlias("taken")).thenReturn(true);

        UpdateLinkRequest request = UpdateLinkRequest.builder().customAlias("taken").build();

        assertThrows(ConflictException.class, () -> urlService.updateLink("abc1234", request, OWNER_ID));
    }

    @Test
    void updateLinkThrowsWhenNotOwner() {
        ShortUrl url = shortUrl("abc1234", null);
        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(url));

        UUID otherOwner = UUID.fromString("00000000-0000-0000-0000-000000000099");
        UpdateLinkRequest request = UpdateLinkRequest.builder().customAlias("x").build();

        assertThrows(ConflictException.class, () -> urlService.updateLink("abc1234", request, otherOwner));
    }

    @Test
    void updateLinkThrowsWhenNotFound() {
        when(shortUrlRepository.findByShortCodeOrCustomAlias("nope", "nope")).thenReturn(Optional.empty());
        UpdateLinkRequest request = UpdateLinkRequest.builder().customAlias("x").build();

        assertThrows(ResourceNotFoundException.class, () -> urlService.updateLink("nope", request, OWNER_ID));
    }

    @Test
    void getUserLinksMapsPage() {
        when(shortUrlRepository.findByOwnerId(eq(OWNER_ID), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(shortUrl("abc1234", null))));

        var page = urlService.getUserLinks(OWNER_ID, 0, 20);

        assertEquals(1, page.getTotalElements());
        assertEquals("abc1234", page.getContent().get(0).getShortCode());
    }

    @Test
    void getUserLinksWithCursorWithoutCursor() {
        when(shortUrlRepository.findByOwnerIdWithCursor(eq(OWNER_ID), eq(""), any()))
                .thenReturn(List.of(shortUrl("abc1234", null)));

        var links = urlService.getUserLinksWithCursor(OWNER_ID, null, 20);

        assertEquals(1, links.size());
        assertEquals("abc1234", links.get(0).getShortCode());
    }

    @Test
    void getUserLinksWithCursorWithCursor() {
        when(shortUrlRepository.findByOwnerIdWithCursor(eq(OWNER_ID), eq("abc1234"), any()))
                .thenReturn(List.of(shortUrl("def5678", null)));

        var links = urlService.getUserLinksWithCursor(OWNER_ID, "abc1234", 20);

        assertEquals(1, links.size());
        assertEquals("def5678", links.get(0).getShortCode());
    }

    @Test
    void createLinkUsesSnowflakeCode() {
        when(urlConfig.getBaseUrl()).thenReturn("http://localhost:8080");
        when(snowflakeIdGenerator.nextId()).thenReturn(123456789L);

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .build();

        var response = urlService.createLink(request, OWNER_ID);

        assertNotNull(response.getShortCode());
        assertFalse(response.getShortCode().length() > 12);
        verify(snowflakeIdGenerator).nextId();
        verify(shortUrlRepository, never()).save(any(ShortUrl.class));
    }

    @Test
    void createLinkWithTakenCustomAliasThrows() {
        when(shortUrlRepository.existsByCustomAlias("taken")).thenReturn(true);

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("taken")
                .build();

        assertThrows(ConflictException.class, () -> urlService.createLink(request, OWNER_ID));
    }

    @Test
    void deactivateLinkThrowsWhenNotFound() {
        when(shortUrlRepository.findByShortCodeOrCustomAlias("nope", "nope")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> urlService.deactivateLink("nope", OWNER_ID));
    }

    @Test
    void deactivateLinkSucceedsForOwner() {
        when(shortUrlRepository.findByShortCodeOrCustomAlias("abc1234", "abc1234"))
                .thenReturn(Optional.of(shortUrl("abc1234", null)));

        urlService.deactivateLink("abc1234", OWNER_ID);

        verify(shortUrlRepository).deactivateByCode(eq("abc1234"), any(Instant.class));
        verify(cacheService).evict("abc1234");
    }

    @Test
    void isAliasAvailableReturnsFalseWhenCustomAliasExists() {
        when(shortUrlRepository.existsByCustomAlias("taken")).thenReturn(true);

        assertFalse(urlService.isAliasAvailable("taken"));
    }
}