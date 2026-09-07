package com.urlshortener.gateway.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class RateLimitGlobalFilter implements GlobalFilter, Ordered {

    private static final long ANONYMOUS_QUOTA = 100;
    private static final long AUTHENTICATED_QUOTA = 1000;
    private static final Duration REFILL_WINDOW = Duration.ofMinutes(1);

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        boolean authenticated = isAuthenticated(exchange);
        long capacity = authenticated ? AUTHENTICATED_QUOTA : ANONYMOUS_QUOTA;

        Bucket bucket = buckets.computeIfAbsent(
                resolveClientKey(exchange, authenticated),
                key -> createBucket(capacity));

        if (bucket.tryConsume(1)) {
            setRateLimitHeaders(exchange, bucket);
            return chain.filter(exchange);
        }

        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory()
                        .wrap("{\"error\":\"Rate limit exceeded\"}".getBytes())));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    private Bucket createBucket(long capacity) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, REFILL_WINDOW)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientKey(ServerWebExchange exchange, boolean authenticated) {
        String remoteAddr = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
        if (authenticated) {
            String auth = exchange.getRequest().getHeaders().getFirst("Authorization");
            return "auth:" + Integer.toHexString(auth.hashCode()) + ":" + remoteAddr;
        }
        return "anon:" + remoteAddr;
    }

    private boolean isAuthenticated(ServerWebExchange exchange) {
        return exchange.getRequest().getHeaders().containsKey("Authorization");
    }

    private void setRateLimitHeaders(ServerWebExchange exchange, Bucket bucket) {
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        exchange.getResponse().getHeaders().add("X-Rate-Limit-Remaining",
                String.valueOf(probe.getRemainingTokens()));
        exchange.getResponse().getHeaders().add("X-Rate-Limit-Reset",
                String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000L));
    }
}