package com.urlshortener.url.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CacheServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;

    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        cacheService = new CacheService(redisTemplate, objectMapper);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void getReturnsValueWhenPresent() {
        when(valueOperations.get("url:cache:key1")).thenReturn("{\"value\":\"hello\"}");

        Optional<CacheValue> result = cacheService.get("key1", CacheValue.class);

        assertTrue(result.isPresent());
        assertEquals("hello", result.get().getValue());
    }

    @Test
    void getReturnsEmptyWhenMissing() {
        when(valueOperations.get("url:cache:key1")).thenReturn(null);

        Optional<CacheValue> result = cacheService.get("key1", CacheValue.class);

        assertTrue(result.isEmpty());
    }

    @Test
    void getReturnsEmptyOnException() {
        when(valueOperations.get("url:cache:key1")).thenThrow(new RuntimeException("redis down"));

        Optional<CacheValue> result = cacheService.get("key1", CacheValue.class);

        assertTrue(result.isEmpty());
    }

    @Test
    void putStoresSerializedValueWithTtl() throws Exception {
        CacheValue value = new CacheValue("hello");

        cacheService.put("key1", value, Duration.ofMinutes(5));

        verify(valueOperations).set(eq("url:cache:key1"),
                eq(objectMapper.writeValueAsString(value)), eq(Duration.ofMinutes(5)));
    }

    @Test
    void putDefaultTtlUsesHour() throws Exception {
        CacheValue value = new CacheValue("hello");

        cacheService.put("key1", value);

        verify(valueOperations).set(eq("url:cache:key1"),
                eq(objectMapper.writeValueAsString(value)), eq(Duration.ofHours(1)));
    }

    @Test
    void putSwallowsSerializationError() {
        Cyclic cyclic = new Cyclic();
        cyclic.setSelf(cyclic);

        cacheService.put("key1", cyclic, Duration.ofMinutes(1));

        verify(valueOperations, never()).set(anyString(), anyString(), any(Duration.class));
    }

    @Test
    void evictDeletesKey() {
        cacheService.evict("key1");

        verify(redisTemplate).delete("url:cache:key1");
    }

    @Test
    void evictPatternDeletesOnlyWhenKeysExist() {
        when(redisTemplate.keys("url:cache:user:*")).thenReturn(Set.of("url:cache:user:1"));

        cacheService.evictPattern("user:*");

        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void evictPatternSkipsWhenNoKeys() {
        when(redisTemplate.keys("url:cache:user:*")).thenReturn(Set.of());

        cacheService.evictPattern("user:*");

        verify(redisTemplate, never()).delete(anyCollection());
    }

    public static class CacheValue {
        private String value;

        public CacheValue() {
        }

        public CacheValue(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }

    public static class Cyclic {
        private Cyclic self;

        public Cyclic() {
        }

        public Cyclic getSelf() {
            return self;
        }

        public void setSelf(Cyclic self) {
            this.self = self;
        }
    }
}
