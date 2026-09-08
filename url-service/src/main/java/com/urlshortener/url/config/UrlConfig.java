package com.urlshortener.url.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.url")
public class UrlConfig {

    private String baseUrl = "http://localhost:8080";
    private int defaultCodeLength = 7;
    private int codePoolWarmSize = 10_000;
    private int codePoolRefillThreshold = 5_000;

    private Cache cache = new Cache();

    @Data
    public static class Cache {
        private long caffeineTtlMinutes = 5;
        private long redisTtlHours = 1;
        private int caffeineMaxSize = 10_000;
    }
}
