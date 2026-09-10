package com.urlshortener.url.cache;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BloomFilterServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    private BloomFilterService bloomFilterService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        bloomFilterService = new BloomFilterService(redisTemplate);
    }

    @Test
    void initWarmsFromRedisMembers() {
        when(setOperations.members("url:bloom:filter"))
                .thenReturn(Set.of("aaa1111", "bbb2222"));

        bloomFilterService.init();

        assertTrue(bloomFilterService.mightContain("aaa1111"));
    }

    @Test
    void initHandlesNullMembers() {
        when(setOperations.members("url:bloom:filter")).thenReturn(null);

        bloomFilterService.init();

        assertFalse(bloomFilterService.mightContain("zzz9999"));
    }

    @Test
    void mightContainReturnsFalseForAbsent() {
        bloomFilterService.init();

        assertFalse(bloomFilterService.mightContain("zzz9999"));
    }

    @Test
    void putAddsToFilterAndRedis() {
        bloomFilterService.init();

        bloomFilterService.put("abc1234");

        assertTrue(bloomFilterService.mightContain("abc1234"));
        verify(setOperations).add("url:bloom:filter", "abc1234");
    }

    @Test
    void putAllAddsAllCodes() {
        bloomFilterService.init();

        Set<String> codes = Set.of("aaa1111", "bbb2222");
        bloomFilterService.putAll(codes);

        assertTrue(bloomFilterService.mightContain("aaa1111"));
        assertTrue(bloomFilterService.mightContain("bbb2222"));
        verify(setOperations).union(eq("url:bloom:filter"), eq(codes));
    }
}
