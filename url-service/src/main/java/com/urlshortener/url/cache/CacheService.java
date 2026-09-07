package com.urlshortener.url.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String URL_CACHE_PREFIX = "url:cache:";
    private static final Duration DEFAULT_TTL = Duration.ofHours(1);

    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            String json = redisTemplate.opsForValue().get(URL_CACHE_PREFIX + key);
            if (json != null) {
                return Optional.of(objectMapper.readValue(json, type));
            }
        } catch (Exception e) {
            log.warn("Cache get error for key {}: {}", key, e.getMessage());
        }
        return Optional.empty();
    }

    public void put(String key, Object value, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(URL_CACHE_PREFIX + key, json, ttl);
        } catch (Exception e) {
            log.warn("Cache put error for key {}: {}", key, e.getMessage());
        }
    }

    public void put(String key, Object value) {
        put(key, value, DEFAULT_TTL);
    }

    public void evict(String key) {
        redisTemplate.delete(URL_CACHE_PREFIX + key);
    }

    public void evictPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(URL_CACHE_PREFIX + pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
