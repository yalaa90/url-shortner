package com.urlshortener.load;

import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;

import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static io.gatling.javaapi.http.HttpDsl.http;

abstract class BaseSimulation extends Simulation {

    protected static final String BASE_URL = envOr("LT_BASE_URL", "http://localhost:8081");
    protected static final String OWNER_ID = envOr("LT_OWNER_ID", "00000000-0000-0000-0000-000000000001");

    protected final HttpProtocolBuilder httpProtocol = http
            .baseUrl(BASE_URL)
            .acceptHeader("application/json")
            .contentTypeHeader("application/json")
            .acceptEncodingHeader("gzip, deflate");

    protected static String envOr(String key, String fallback) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            value = System.getProperty(key);
        }
        return (value == null || value.isBlank()) ? fallback : value;
    }

    protected static int intEnvOr(String key, int fallback) {
        return Integer.parseInt(envOr(key, String.valueOf(fallback)));
    }

    protected static long longEnvOr(String key, long fallback) {
        return Long.parseLong(envOr(key, String.valueOf(fallback)));
    }

    protected static Iterator<Map<String, Object>> urlFeeder() {
        return Stream.generate(() -> Map.<String, Object>of(
                        "targetUrl",
                        "https://example.com/" + UUID.randomUUID() + "/" + UUID.randomUUID()))
                .iterator();
    }
}