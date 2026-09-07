package com.urlshortener.analytics.controller;

import com.urlshortener.analytics.dto.AnalyticsResponse;
import com.urlshortener.analytics.service.AnalyticsService;
import com.urlshortener.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "URL click analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/{code}")
    @Operation(summary = "Get analytics for a short URL")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @PathVariable String code,
            @RequestParam(defaultValue = "30") int days) {

        AnalyticsResponse response = analyticsService.getAnalytics(code, days);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}