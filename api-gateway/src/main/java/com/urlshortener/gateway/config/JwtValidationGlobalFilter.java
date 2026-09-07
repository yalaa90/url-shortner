package com.urlshortener.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.function.Predicate;

@Component
public class JwtValidationGlobalFilter implements GlobalFilter, Ordered {

    private final List<Predicate<String>> publicPaths = List.of(
            p -> p.matches("^/api/v1/links/[^/]+$"),
            p -> p.startsWith("/fallback"),
            p -> p.startsWith("/actuator"),
            p -> p.startsWith("/swagger"),
            p -> p.startsWith("/api-docs"),
            p -> p.startsWith("/api/gateway-docs")
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null) {
            return reject(exchange);
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private boolean isPublicPath(String path) {
        return publicPaths.stream().anyMatch(predicate -> predicate.test(path));
    }

    private Mono<Void> reject(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory()
                        .wrap("{\"error\":\"Missing or invalid Authorization header\"}".getBytes())));
    }
}