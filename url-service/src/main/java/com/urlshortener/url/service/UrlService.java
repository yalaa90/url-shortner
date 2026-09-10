package com.urlshortener.url.service;

import com.urlshortener.exception.ConflictException;
import com.urlshortener.exception.ResourceNotFoundException;
import com.urlshortener.url.cache.BloomFilterService;
import com.urlshortener.url.cache.CacheService;
import com.urlshortener.url.config.UrlConfig;
import com.urlshortener.url.config.datasource.FollowerDataSource;
import com.urlshortener.url.config.datasource.LeaderDataSource;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.dto.UpdateLinkRequest;
import com.urlshortener.url.encoding.Base62Encoder;
import com.urlshortener.url.encoding.SnowflakeIdGenerator;
import com.urlshortener.url.messaging.LinkCreatedEvent;
import com.urlshortener.url.messaging.LinkEventPublisher;
import com.urlshortener.url.mapper.LinkMapper;
import com.urlshortener.url.messaging.ClickEventPublisher;
import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UrlService {

    private final ShortUrlRepository shortUrlRepository;
    private final Base62Encoder base62Encoder;
    private final SnowflakeIdGenerator snowflakeIdGenerator;
    private final BloomFilterService bloomFilterService;
    private final CacheService cacheService;
    private final UrlResolutionService urlResolutionService;
    private final LinkMapper linkMapper;
    private final ClickEventPublisher clickEventPublisher;
    private final LinkEventPublisher linkEventPublisher;
    private final Timer urlRedirectTimer;
    private final UrlConfig urlConfig;

    public LinkResponse createLink(CreateLinkRequest request, UUID ownerId) {
        String code = resolveOrCreateCode(request.getCustomAlias());
        Instant now = Instant.now();

        LinkCreatedEvent event = LinkCreatedEvent.builder()
                .idempotencyKey(request.getIdempotencyKey() != null
                        ? request.getIdempotencyKey() : UUID.randomUUID().toString())
                .shortCode(code)
                .originalUrl(request.getUrl())
                .customAlias(request.getCustomAlias())
                .ownerId(ownerId)
                .active(true)
                .expiresAt(request.getExpiresAt())
                .createdAt(now)
                .build();

        bloomFilterService.put(code);
        linkEventPublisher.publishLinkCreated(event);

        log.info("Accepted link request, publishing event: code={}, owner={}", code, ownerId);
        return buildOptimisticLinkResponse(event);
    }

    @FollowerDataSource
    public String redirectAndTrack(String code, String ipAddress, String userAgent, String referrer) {
        Timer.Sample sample = Timer.start();
        try {
            String originalUrl = urlResolutionService.resolveRedirectUrl(code)
                    .orElseThrow(() -> new ResourceNotFoundException("ShortUrl", "code", code));

            clickEventPublisher.publishClickEvent(code, ipAddress, userAgent, referrer);
            return originalUrl;
        } finally {
            sample.stop(urlRedirectTimer);
        }
    }

    @Cacheable(value = "linkDetails", key = "#code", unless = "#result == null")
    @Transactional(readOnly = true)
    @FollowerDataSource
    public LinkResponse getLink(String code) {
        ShortUrl shortUrl = shortUrlRepository.findByShortCodeOrCustomAlias(code, code)
                .orElseThrow(() -> new ResourceNotFoundException("ShortUrl", "code", code));
        return buildLinkResponse(shortUrl);
    }

    @CacheEvict(value = {"urlResolution", "linkDetails"}, key = "#code")
    @Transactional
    @LeaderDataSource
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
    @LeaderDataSource
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
    @FollowerDataSource
    public Page<LinkResponse> getUserLinks(UUID ownerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return shortUrlRepository.findByOwnerId(ownerId, pageable)
                .map(this::buildLinkResponse);
    }

    @Transactional(readOnly = true)
    @FollowerDataSource
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

    @FollowerDataSource
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

        long id = snowflakeIdGenerator.nextId();
        return base62Encoder.encodeCompact(id);
    }

    private LinkResponse buildOptimisticLinkResponse(LinkCreatedEvent event) {
        String effectiveCode = event.getCustomAlias() != null
                ? event.getCustomAlias() : event.getShortCode();
        return LinkResponse.builder()
                .id(null)
                .shortCode(effectiveCode)
                .shortUrl(urlConfig.getBaseUrl() + "/" + effectiveCode)
                .originalUrl(event.getOriginalUrl())
                .customAlias(event.getCustomAlias())
                .active(event.isActive())
                .createdAt(event.getCreatedAt())
                .expiresAt(event.getExpiresAt())
                .clickCount(0)
                .build();
    }

    private LinkResponse buildLinkResponse(ShortUrl shortUrl) {
        LinkResponse response = linkMapper.toResponse(shortUrl);
        response.setShortUrl(urlConfig.getBaseUrl() + "/" + shortUrl.getEffectiveCode());
        return response;
    }
}
