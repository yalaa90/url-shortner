package com.urlshortener.url;

import com.urlshortener.url.cache.BloomFilterService;
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class BloomFilterTest {

    @Test
    void testPresentEntriesAreFound() {
        BloomFilter<String> filter = createFilter();
        filter.put("abc123");
        assertTrue(filter.mightContain("abc123"));
    }

    @Test
    void testAbsentEntriesAreRejected() {
        BloomFilter<String> filter = createFilter();
        assertFalse(filter.mightContain("xyz789"));
    }

    @Test
    void testMultipleEntries() {
        BloomFilter<String> filter = createFilter();
        for (int i = 0; i < 1000; i++) {
            filter.put("code" + i);
        }
        for (int i = 0; i < 1000; i++) {
            assertTrue(filter.mightContain("code" + i));
        }
    }

    private BloomFilter<String> createFilter() {
        return BloomFilter.create(
                Funnels.stringFunnel(StandardCharsets.UTF_8),
                10_000_000,
                0.01
        );
    }
}