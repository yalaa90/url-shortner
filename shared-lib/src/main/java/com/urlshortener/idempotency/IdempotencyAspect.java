package com.urlshortener.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotencyAspect {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String IDEMPOTENCY_PREFIX = "idempotency:";

    @Around("@annotation(idempotencyKey)")
    public Object around(ProceedingJoinPoint joinPoint, IdempotencyKey idempotencyKey) throws Throwable {
        HttpServletRequest request = getCurrentRequest();
        String key = request.getHeader(idempotencyKey.headerName());

        if (key == null || key.isBlank()) {
            return joinPoint.proceed();
        }

        String redisKey = IDEMPOTENCY_PREFIX + key;
        Optional<String> cached = Optional.ofNullable(redisTemplate.opsForValue().get(redisKey));

        if (cached.isPresent()) {
            log.debug("Idempotent response found for key: {}", key);
            return objectMapper.readValue(cached.get(), ResponseEntity.class);
        }

        Object result = joinPoint.proceed();

        if (result instanceof ResponseEntity<?> response) {
            if (response.getStatusCode().is2xxSuccessful()) {
                String json = objectMapper.writeValueAsString(result);
                redisTemplate.opsForValue().set(redisKey, json,
                        Duration.ofSeconds(idempotencyKey.ttlSeconds()));
            }
        }

        return result;
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            throw new IllegalStateException("No current HTTP request");
        }
        return attributes.getRequest();
    }
}
