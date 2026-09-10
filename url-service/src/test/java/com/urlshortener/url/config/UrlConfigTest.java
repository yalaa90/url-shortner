package com.urlshortener.url.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UrlConfigTest {

    @Test
    void hasDefaultValues() {
        UrlConfig config = new UrlConfig();

        assertEquals("http://localhost:8080", config.getBaseUrl());
        assertEquals(7, config.getDefaultCodeLength());
        assertEquals(10_000, config.getCodePoolWarmSize());
        assertEquals(5_000, config.getCodePoolRefillThreshold());
        assertNotNull(config.getCache());
        assertEquals(5, config.getCache().getCaffeineTtlMinutes());
        assertEquals(1, config.getCache().getRedisTtlHours());
        assertEquals(10_000, config.getCache().getCaffeineMaxSize());
    }

    @Test
    void settersUpdateValues() {
        UrlConfig config = new UrlConfig();
        UrlConfig.Cache cache = new UrlConfig.Cache();

        config.setBaseUrl("http://example.test");
        config.setDefaultCodeLength(9);
        config.setCodePoolWarmSize(20_000);
        config.setCodePoolRefillThreshold(10_000);
        cache.setCaffeineTtlMinutes(10);
        cache.setRedisTtlHours(2);
        cache.setCaffeineMaxSize(50_000);
        config.setCache(cache);

        assertEquals("http://example.test", config.getBaseUrl());
        assertEquals(9, config.getDefaultCodeLength());
        assertEquals(20_000, config.getCodePoolWarmSize());
        assertEquals(10_000, config.getCodePoolRefillThreshold());
        assertEquals(10, config.getCache().getCaffeineTtlMinutes());
        assertEquals(2, config.getCache().getRedisTtlHours());
        assertEquals(50_000, config.getCache().getCaffeineMaxSize());
    }

    @Test
    void cacheGettersReturnDefaults() {
        UrlConfig.Cache cache = new UrlConfig.Cache();

        assertEquals(5, cache.getCaffeineTtlMinutes());
        assertEquals(1, cache.getRedisTtlHours());
        assertEquals(10_000, cache.getCaffeineMaxSize());
    }

    @Test
    void cacheEqualsHashCodeAndToString() {
        UrlConfig.Cache a = new UrlConfig.Cache();
        a.setCaffeineTtlMinutes(10);
        a.setRedisTtlHours(2);
        a.setCaffeineMaxSize(20_000);
        UrlConfig.Cache b = new UrlConfig.Cache();
        b.setCaffeineTtlMinutes(10);
        b.setRedisTtlHours(2);
        b.setCaffeineMaxSize(20_000);
        UrlConfig.Cache c = new UrlConfig.Cache();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "x");
        assertTrue(a.toString().contains("20000"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }

    @Test
    void configEqualsHashCodeAndToString() {
        UrlConfig a = new UrlConfig();
        UrlConfig b = new UrlConfig();
        UrlConfig c = new UrlConfig();
        c.setBaseUrl("http://other.test");

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "x");
        assertTrue(a.toString().contains("http://localhost:8080"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }
}
