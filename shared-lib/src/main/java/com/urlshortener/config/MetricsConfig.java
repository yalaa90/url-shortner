package com.urlshortener.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public Counter urlRedirectCounter(MeterRegistry registry) {
        return Counter.builder("url.redirect.count")
                .description("Total number of URL redirects")
                .tag("service", "url-service")
                .register(registry);
    }

    @Bean
    public Counter urlCreateCounter(MeterRegistry registry) {
        return Counter.builder("url.create.count")
                .description("Total number of URLs created")
                .tag("service", "url-service")
                .register(registry);
    }

    @Bean
    public Timer urlRedirectTimer(MeterRegistry registry) {
        return Timer.builder("url.redirect.duration")
                .description("URL redirect latency")
                .publishPercentiles(0.5, 0.95, 0.99)
                .tag("service", "url-service")
                .register(registry);
    }

    @Bean
    public Counter cacheHitCounter(MeterRegistry registry) {
        return Counter.builder("cache.hit.count")
                .description("Cache hit count")
                .register(registry);
    }

    @Bean
    public Counter cacheMissCounter(MeterRegistry registry) {
        return Counter.builder("cache.miss.count")
                .description("Cache miss count")
                .register(registry);
    }
}
