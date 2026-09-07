package com.urlshortener.url.cache;

import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class BloomFilterService {

    private final StringRedisTemplate redisTemplate;
    private BloomFilter<String> bloomFilter;

    private static final String BLOOM_KEY = "url:bloom:filter";
    private static final int EXPECTED_INSERTIONS = 10_000_000;
    private static final double FPP = 0.01;

    @PostConstruct
    public void init() {
        bloomFilter = BloomFilter.create(
                Funnels.stringFunnel(StandardCharsets.UTF_8),
                EXPECTED_INSERTIONS,
                FPP
        );

        Set<String> allCodes = redisTemplate.opsForSet().members(BLOOM_KEY);
        if (allCodes != null) {
            allCodes.forEach(bloomFilter::put);
            log.info("Bloom filter warmed with {} entries from Redis", allCodes.size());
        }
    }

    public boolean mightContain(String code) {
        return bloomFilter.mightContain(code);
    }

    public void put(String code) {
        bloomFilter.put(code);
        redisTemplate.opsForSet().add(BLOOM_KEY, code);
    }

    public void putAll(Set<String> codes) {
        codes.forEach(bloomFilter::put);
        redisTemplate.opsForSet().union(BLOOM_KEY, codes);
    }
}
