package com.urlshortener.url.encoding;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SnowflakeIdGeneratorTest {

    private SnowflakeIdGenerator newGenerator(long workerId) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenReturn(workerId);

        SnowflakeIdGenerator generator = new SnowflakeIdGenerator(redis);
        setField(generator, "workerIdKey", "test:worker-id");
        setField(generator, "maxWorkerId", 1023L);
        generator.init();
        return generator;
    }

    private void setField(Object target, String name, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void generatedIdsAreUniqueAndMonotonic() {
        SnowflakeIdGenerator generator = newGenerator(1L);

        Set<Long> ids = new HashSet<>();
        long previous = -1L;
        for (int i = 0; i < 100_000; i++) {
            long id = generator.nextId();
            assertTrue(ids.add(id), "duplicate id: " + id);
            assertTrue(id > previous, "ids not monotonic");
            previous = id;
        }
    }

    @Test
    void generatesPositiveIds() {
        SnowflakeIdGenerator generator = newGenerator(5L);
        assertTrue(generator.nextId() > 0);
    }

    @Test
    void workerIdIsExposed() {
        SnowflakeIdGenerator generator = newGenerator(42L);
        assertEquals(42L, generator.getWorkerId());
    }
}
