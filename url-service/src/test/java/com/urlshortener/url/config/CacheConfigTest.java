package com.urlshortener.url.config;

import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

import static org.junit.jupiter.api.Assertions.*;

class CacheConfigTest {

    @Test
    void createsCacheManager() {
        CacheConfig config = new CacheConfig();

        CacheManager cacheManager = config.cacheManager();

        assertNotNull(cacheManager);
    }
}
