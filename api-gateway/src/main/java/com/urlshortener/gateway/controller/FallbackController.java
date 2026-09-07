package com.urlshortener.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/{service}")
    public ResponseEntity<Map<String, Object>> fallback(@PathVariable String service) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "error", "Service temporarily unavailable",
                        "service", service,
                        "status", 503
                ));
    }

    @GetMapping("/url-service")
    public ResponseEntity<Map<String, Object>> urlServiceFallback() {
        return fallback("url-service");
    }

    @GetMapping("/analytics-service")
    public ResponseEntity<Map<String, Object>> analyticsServiceFallback() {
        return fallback("analytics-service");
    }

    @GetMapping("/user-service")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        return fallback("user-service");
    }
}