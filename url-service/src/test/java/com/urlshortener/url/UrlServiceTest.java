package com.urlshortener.url;

import com.urlshortener.exception.ConflictException;
import com.urlshortener.exception.ResourceNotFoundException;
import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.cache.CodePoolManager;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.encoding.Base62Encoder;
import com.urlshortener.url.mapper.LinkMapperImpl;
import com.urlshortener.url.messaging.ClickEventPublisher;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import com.urlshortener.url.service.UrlService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock private ShortUrlRepository shortUrlRepository;
    @Mock private CodePoolManager codePoolManager;
    @Mock private BloomFilterService bloomFilterService;
    @Mock private CacheService cacheService;
    @Mock private ClickEventPublisher clickEventPublisher;

    private UrlService urlService;
    private SimpleMeterRegistry meterRegistry;

    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        Counter createCounter = Counter.builder("url.create.count").register(meterRegistry);
        Timer redirectTimer = Timer.builder("url.redirect.duration").register(meterRegistry);

        urlService = new UrlService(
                shortUrlRepository,
                new Base62Encoder(),
                codePoolManager,
                bloomFilterService,
                cacheService,
                new LinkMapperImpl(),
                clickEventPublisher,
                createCounter,
                redirectTimer
        );
    }

    @Test
    void createLinkWithGeneratedCode() {
        when(codePoolManager.borrowCode()).thenReturn("abc1234");
        when(shortUrlRepository.save(any(ShortUrl.class))).thenAnswer(inv -> {
            ShortUrl url = inv.getArgument(0);
            url.setId(1L);
            return url;
        });

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com/very/very/long/path?with=query&params=true")
                .build();

        var response = urlService.createLink(request, OWNER_ID);

        assertNotNull(response);
        assertEquals("abc1234", response.getShortCode());
        assertTrue(response.getShortUrl().contains("abc1234"));
        assertEquals("https://example.com/very/very/long/path?with=query&params=true",
                response.getOriginalUrl());
        verify(shortUrlRepository).save(any(ShortUrl.class));
        verify(bloomFilterService).put("abc1234");
    }

    @Test
    void createLinkWithCustomAlias() {
        when(shortUrlRepository.existsByCustomAlias("my-alias")).thenReturn(false);
        when(shortUrlRepository.existsByShortCode("my-alias")).thenReturn(false);
        when(shortUrlRepository.save(any(ShortUrl.class))).thenAnswer(inv -> {
            ShortUrl url = inv.getArgument(0);
            url.setId(1L);
            return url;
        });

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("my-alias")
                .build();

        var response = urlService.createLink(request, OWNER_ID);

        assertEquals("my-alias", response.getShortCode());
        assertFalse(response.getShortUrl().contains("abc"));
    }

    @Test
    void createLinkWithTakenAliasThrows() {
        when(shortUrlRepository.existsByCustomAlias("taken")).thenReturn(true);

        CreateLinkRequest request = CreateLinkRequest.builder()
                .url("https://example.com")
                .customAlias("taken")
                .build();

        assertThrows(ConflictException.class, () -> urlService.createLink(request, OWNER_ID));
    }

    @Test
    void resolveUrlReturnsNullForUnknownCode() {
        when(bloomFilterService.mightContain("unknown1")).thenReturn(false);

        ShortUrl result = urlService.resolveUrl("unknown1");

        assertNull(result);
        verify(shortUrlRepository, never()).findByShortCode(anyString());
    }

    @Test
    void resolveUrlReturnsShortUrl() {
        ShortUrl shortUrl = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(bloomFilterService.mightContain("abc1234")).thenReturn(true);
        when(shortUrlRepository.findActiveCode(eq("abc1234"), any(Instant.class)))
                .thenReturn(Optional.of("abc1234"));
        when(shortUrlRepository.findByShortCode("abc1234")).thenReturn(Optional.of(shortUrl));

        ShortUrl result = urlService.resolveUrl("abc1234");

        assertNotNull(result);
        assertEquals("https://example.com", result.getOriginalUrl());
        verify(bloomFilterService).mightContain("abc1234");
    }

    @Test
    void redirectAndTrackReturnsOriginalUrl() {
        ShortUrl shortUrl = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        when(bloomFilterService.mightContain("abc1234")).thenReturn(true);
        when(shortUrlRepository.findActiveCode(eq("abc1234"), any(Instant.class)))
                .thenReturn(Optional.of("abc1234"));
        when(shortUrlRepository.findByShortCode("abc1234")).thenReturn(Optional.of(shortUrl));

        String result = urlService.redirectAndTrack("abc1234", "192.168.1.1", "Mozilla", "google.com");

        assertEquals("https://example.com", result);
        verify(clickEventPublisher).publishClickEvent(eq("abc1234"), eq("192.168.1.1"),
                eq("Mozilla"), eq("google.com"));
    }

    @Test
    void redirectAndTrackThrowsForUnknown() {
        when(bloomFilterService.mightContain("nope")).thenReturn(false);

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
}