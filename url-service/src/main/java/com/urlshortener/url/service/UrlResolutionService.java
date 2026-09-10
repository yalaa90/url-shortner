package com.urlshortener.url.service;

import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.config.datasource.FollowerDataSource;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UrlResolutionService {

    private final BloomFilterService bloomFilterService;
    private final ShortUrlRepository shortUrlRepository;
    private final CacheService cacheService;

    private static final Duration REDIRECT_CACHE_TTL = Duration.ofHours(1);

    public Optional<String> resolveRedirectUrl(String code) {
        Optional<String> cached = cacheService.get(code, String.class);
        if (cached.isPresent()) {
            log.debug("Redis cache hit for code: {}", code);
            return cached;
        }

        ShortUrl shortUrl = resolveFromDb(code);
        if (shortUrl == null) {
            return Optional.empty();
        }

        cacheService.put(code, shortUrl.getOriginalUrl(), REDIRECT_CACHE_TTL);
        log.debug("Cached redirect URL for code: {}", code);
        return Optional.of(shortUrl.getOriginalUrl());
    }

    @Transactional(readOnly = true)
    @FollowerDataSource
    public ShortUrl resolveFromDb(String code) {
        if (!bloomFilterService.mightContain(code)) {
            log.debug("Bloom filter negative for code: {}", code);
            return null;
        }

        return shortUrlRepository.findActiveCode(code, Instant.now())
                .orElse(null);
    }
}
