package com.urlshortener.url.cache;

import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
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
public class CodePoolManager {

    private final StringRedisTemplate redisTemplate;
    private final ShortUrlRepository shortUrlRepository;

    private static final String CODE_POOL_KEY = "url:code:pool";
    private static final String USED_CODE_KEY = "url:code:used";
    private static final int POOL_TARGET = 10_000;

    public void warmPool() {
        long currentSize = redisTemplate.opsForSet().size(CODE_POOL_KEY);
        if (currentSize < POOL_TARGET / 2) {
            log.info("Warming code pool: current size={}, target={}", currentSize, POOL_TARGET);
            Set<String> newCodes = generateAndFilterPool(POOL_TARGET - (int) currentSize);
            if (!newCodes.isEmpty()) {
                redisTemplate.opsForSet().add(CODE_POOL_KEY, newCodes.toArray(new String[0]));
            }
            log.info("Code pool warmed: added {} codes", newCodes.size());
        }
    }

    public String borrowCode() {
        String code = redisTemplate.opsForSet().pop(CODE_POOL_KEY);
        if (code == null) {
            log.warn("Code pool empty, generating on-demand");
            code = generateUniqueCode();
        }
        redisTemplate.opsForSet().add(USED_CODE_KEY, code);
        return code;
    }

    public void returnCode(String code) {
        redisTemplate.opsForSet().remove(USED_CODE_KEY, code);
        redisTemplate.opsForSet().add(CODE_POOL_KEY, code);
    }

    public long availableCount() {
        Long size = redisTemplate.opsForSet().size(CODE_POOL_KEY);
        return size != null ? size : 0;
    }

    private Set<String> generateAndFilterPool(int count) {
        com.urlshortener.url.encoding.Base62Encoder encoder = new com.urlshortener.url.encoding.Base62Encoder();
        Set<String> existingUsed = redisTemplate.opsForSet().members(USED_CODE_KEY);
        Set<String> existingPool = redisTemplate.opsForSet().members(CODE_POOL_KEY);

        return encoder.generateBatch(count * 2).stream()
                .filter(code -> !existingUsed.contains(code) && !existingPool.contains(code))
                .limit(count)
                .collect(java.util.stream.Collectors.toSet());
    }

    private String generateUniqueCode() {
        com.urlshortener.url.encoding.Base62Encoder encoder = new com.urlshortener.url.encoding.Base62Encoder();
        String code;
        int attempts = 0;
        do {
            code = encoder.generateRandom();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Unable to generate unique code after 100 attempts");
            }
        } while (shortUrlRepository.existsByShortCode(code));
        return code;
    }
}
