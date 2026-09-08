package com.urlshortener.url.service;

import com.urlshortener.exception.ConflictException;
import com.urlshortener.exception.ResourceNotFoundException;
import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.cache.CodePoolManager;
import com.urlshortener.url.config.UrlConfig;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.dto.UpdateLinkRequest;
import com.urlshortener.url.encoding.Base62Encoder;
import com.urlshortener.url.mapper.LinkMapper;
import com.urlshortener.url.messaging.ClickEventPublisher;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class UrlService {

    private final ShortUrlRepository shortUrlRepository;
    private final Base62Encoder base62Encoder;
    private final CodePoolManager codePoolManager;
    private final BloomFilterService bloomFilterService;
    private final CacheService cacheService;
    private final LinkMapper linkMapper;
    private final ClickEventPublisher clickEventPublisher;
    private final Counter urlCreateCounter;
    private final Timer urlRedirectTimer;
    private final UrlConfig urlConfig;

    @Transactional
    public LinkResponse createLink(CreateLinkRequest request, UUID ownerId) {
        String code = resolveOrCreateCode(request.getCustomAlias());

        ShortUrl shortUrl = ShortUrl.builder()
                .shortCode(code)
                .originalUrl(request.getUrl())
                .customAlias(request.getCustomAlias())
                .ownerId(ownerId)
                .active(true)
                .expiresAt(request.getExpiresAt())
                .build();

        shortUrl = shortUrlRepository.save(shortUrl);
        bloomFilterService.put(code);
        urlCreateCounter.increment();

        log.info("Created short URL: code={}, owner={}", code, ownerId);
        return buildLinkResponse(shortUrl);
    }

    @Cacheable(value = "urlResolution", key = "#code", unless = "#result == null")
    @Transactional(readOnly = true)
    public ShortUrl resolveUrl(String code) {
        if (!bloomFilterService.mightContain(code)) {
            log.debug("Bloom filter negative for code: {}", code);
            return null;
        }

        return shortUrlRepository.findActiveCode(code, Instant.now())
                .flatMap(shortUrlRepository::findByShortCode)
                .orElse(null);
    }

    public String redirectAndTrack(String code, String ipAddress, String userAgent, String referrer) {
        Timer.Sample sample = Timer.start();
        try {
            ShortUrl shortUrl = resolveUrl(code);
            if (shortUrl == null) {
                throw new ResourceNotFoundException("ShortUrl", "code", code);
            }

            clickEventPublisher.publishClickEvent(code, ipAddress, userAgent, referrer);
            return shortUrl.getOriginalUrl();
        } finally {
            sample.stop(urlRedirectTimer);
        }
    }

    @Cacheable(value = "linkDetails", key = "#code", unless = "#result == null")
    @Transactional(readOnly = true)
    public LinkResponse getLink(String code) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCodeOrCustomAlias(code, code)
                .orElseThrow(() -> new ResourceNotFoundException("ShortUrl", "code", code));
        return buildLinkResponse(shortUrl);
    }

    @CacheEvict(value = {"urlResolution", "linkDetails"}, key = "#code")
    @Transactional
    public void deactivateLink(String code, UUID ownerId) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCodeOrCustomAlias(code, code)
                .orElseThrow(() -> new ResourceNotFoundException("ShortUrl", "code", code));

        if (!shortUrl.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this link");
        }

        shortUrlRepository.deactivateByCode(shortUrl.getShortCode(), Instant.now());
        cacheService.evict(code);
        log.info("Deactivated short URL: code={}, owner={}", code, ownerId);
    }

    @CachePut(value = "linkDetails", key = "#code")
    @Transactional
    public LinkResponse updateLink(String code, UpdateLinkRequest request, UUID ownerId) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCodeOrCustomAlias(code, code)
                .orElseThrow(() -> new ResourceNotFoundException("ShortUrl", "code", code));

        if (!shortUrl.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this link");
        }

        if (request.getCustomAlias() != null) {
            if (shortUrlRepository.existsByCustomAlias(request.getCustomAlias())) {
                throw new ConflictException("Alias already taken",
                        java.util.Map.of("alias", request.getCustomAlias()));
            }
            shortUrlRepository.updateCustomAlias(shortUrl.getShortCode(), request.getCustomAlias());
            shortUrl.setCustomAlias(request.getCustomAlias());
        }

        if (request.getExpiresAt() != null) {
            shortUrlRepository.updateExpiration(shortUrl.getShortCode(), request.getExpiresAt());
            shortUrl.setExpiresAt(request.getExpiresAt());
        }

        cacheService.evict(code);
        return buildLinkResponse(shortUrl);
    }

    @Transactional(readOnly = true)
    public Page<LinkResponse> getUserLinks(UUID ownerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return shortUrlRepository.findByOwnerId(ownerId, pageable)
                .map(this::buildLinkResponse);
    }

    @Transactional(readOnly = true)
    public List<LinkResponse> getUserLinksWithCursor(UUID ownerId, String cursor, int size) {
        Pageable pageable = PageRequest.of(0, size + 1);
        List<ShortUrl> results;

        if (cursor == null || cursor.isBlank()) {
            results = shortUrlRepository.findByOwnerIdWithCursor(ownerId, "", pageable);
        } else {
            results = shortUrlRepository.findByOwnerIdWithCursor(ownerId, cursor, pageable);
        }

        return results.stream()
                .map(this::buildLinkResponse)
                .toList();
    }

    public boolean isAliasAvailable(String alias) {
        return !shortUrlRepository.existsByCustomAlias(alias) &&
               !shortUrlRepository.existsByShortCode(alias);
    }

    private String resolveOrCreateCode(String customAlias) {
        if (customAlias != null) {
            if (!isAliasAvailable(customAlias)) {
                throw new ConflictException("Alias already in use",
                        java.util.Map.of("alias", customAlias));
            }
            return customAlias;
        }

        String code = codePoolManager.borrowCode();
        int attempts = 0;
        while (shortUrlRepository.existsByShortCode(code) && attempts < 10) {
            code = codePoolManager.borrowCode();
            attempts++;
        }

        if (attempts >= 10) {
            code = base62Encoder.generateRandom();
        }

        return code;
    }

    private LinkResponse buildLinkResponse(ShortUrl shortUrl) {
        LinkResponse response = linkMapper.toResponse(shortUrl);
        response.setShortUrl(urlConfig.getBaseUrl() + "/" + shortUrl.getEffectiveCode());
        return response;
    }
}
