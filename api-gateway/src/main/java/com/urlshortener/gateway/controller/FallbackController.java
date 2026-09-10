package com.urlshortener.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/{service}")
    public ResponseEntity<Map<String, Object>> fallback(@PathVariable String service) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "error", "Service temporarily unavailable",
                        "service", service,
                        "status", 503
                ));
    }

    @RequestMapping("/url-service")
    public ResponseEntity<Map<String, Object>> urlServiceFallback() {
        return fallback("url-service");
    }

    @RequestMapping("/analytics-service")
    public ResponseEntity<Map<String, Object>> analyticsServiceFallback() {
        return fallback("analytics-service");
    }

    @RequestMapping("/user-service")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        return fallback("user-service");
    }
}