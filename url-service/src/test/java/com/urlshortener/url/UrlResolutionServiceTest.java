package com.urlshortener.url;

import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import com.urlshortener.url.service.UrlResolutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlResolutionServiceTest {

    @Mock private BloomFilterService bloomFilterService;
    @Mock private ShortUrlRepository shortUrlRepository;
    @Mock private CacheService cacheService;

    private UrlResolutionService urlResolutionService;

    @BeforeEach
    void setUp() {
        urlResolutionService = new UrlResolutionService(bloomFilterService, shortUrlRepository, cacheService);
    }

    @Test
    void returnsCachedUrlWhenPresent() {
        when(cacheService.get("abc1234", String.class))
                .thenReturn(Optional.of("https://example.com"));

        Optional<String> result = urlResolutionService.resolveRedirectUrl("abc1234");

        assertTrue(result.isPresent());
        assertEquals("https://example.com", result.get());
        verify(bloomFilterService, never()).mightContain(anyString());
        verify(shortUrlRepository, never()).findActiveCode(anyString(), any(Instant.class));
    }

    @Test
    void queriesDbOnCacheMissAndCachesResult() {
        when(cacheService.get("abc1234", String.class)).thenReturn(Optional.empty());
        when(bloomFilterService.mightContain("abc1234")).thenReturn(true);

        ShortUrl shortUrl = ShortUrl.builder()
                .id(1L)
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .active(true)
                .createdAt(Instant.now())
                .build();
        when(shortUrlRepository.findActiveCode(eq("abc1234"), any(Instant.class)))
                .thenReturn(Optional.of(shortUrl));

        Optional<String> result = urlResolutionService.resolveRedirectUrl("abc1234");

        assertTrue(result.isPresent());
        assertEquals("https://example.com", result.get());
        verify(cacheService).put(eq("abc1234"), eq("https://example.com"), any());
    }

    @Test
    void returnsEmptyWhenBloomFilterNegative() {
        when(cacheService.get("unknown", String.class)).thenReturn(Optional.empty());
        when(bloomFilterService.mightContain("unknown")).thenReturn(false);

        Optional<String> result = urlResolutionService.resolveRedirectUrl("unknown");

        assertFalse(result.isPresent());
        verify(shortUrlRepository, never()).findActiveCode(anyString(), any(Instant.class));
    }

    @Test
    void returnsEmptyWhenDbReturnsEmpty() {
        when(cacheService.get("expired", String.class)).thenReturn(Optional.empty());
        when(bloomFilterService.mightContain("expired")).thenReturn(true);
        when(shortUrlRepository.findActiveCode(eq("expired"), any(Instant.class)))
                .thenReturn(Optional.empty());

        Optional<String> result = urlResolutionService.resolveRedirectUrl("expired");

        assertFalse(result.isPresent());
        verify(cacheService, never()).put(anyString(), anyString(), any());
    }
}
