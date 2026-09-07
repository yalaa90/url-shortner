package com.urlshortener.url.controller;

import com.urlshortener.dto.ApiResponse;
import com.urlshortener.idempotency.IdempotencyKey;
import com.urlshortener.pagination.CursorPage;
import com.urlshortener.url.dto.AliasCheckResponse;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.dto.UpdateLinkRequest;
import com.urlshortener.url.service.UrlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/links")
@RequiredArgsConstructor
@Tag(name = "URL Shortener", description = "URL shortening operations")
public class UrlController {

    private final UrlService urlService;

    @PostMapping
    @IdempotencyKey
    @Operation(summary = "Create a short URL")
    public ResponseEntity<ApiResponse<LinkResponse>> createLink(
            @Valid @RequestBody CreateLinkRequest request,
            @RequestHeader(value = "X-Owner-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID ownerId,
            HttpServletRequest httpRequest) {

        LinkResponse response = urlService.createLink(request, ownerId);
        URI location = URI.create("/api/v1/links/" + response.getShortCode());
        return ResponseEntity.created(location)
                .body(ApiResponse.success("Link created", response));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Resolve a short URL (301 redirect)")
    public ResponseEntity<Void> resolveRedirect(
            @PathVariable String code,
            @Parameter(hidden = true) @RequestHeader(value = "X-Forwarded-For", required = false) String ipAddress,
            @Parameter(hidden = true) @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @Parameter(hidden = true) @RequestHeader(value = "Referer", required = false) String referrer) {

        String originalUrl = urlService.redirectAndTrack(code, ipAddress, userAgent, referrer);
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY)
                .location(URI.create(originalUrl))
                .build();
    }

    @GetMapping("/{code}/details")
    @Operation(summary = "Get link details")
    public ResponseEntity<ApiResponse<LinkResponse>> getLink(@PathVariable String code) {
        LinkResponse response = urlService.getLink(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{code}")
    @Operation(summary = "Deactivate a short URL")
    public ResponseEntity<ApiResponse<Void>> deactivateLink(
            @PathVariable String code,
            @RequestHeader(value = "X-Owner-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID ownerId) {

        urlService.deactivateLink(code, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Link deactivated", null));
    }

    @PatchMapping("/{code}")
    @Operation(summary = "Update link expiration or alias")
    public ResponseEntity<ApiResponse<LinkResponse>> updateLink(
            @PathVariable String code,
            @Valid @RequestBody UpdateLinkRequest request,
            @RequestHeader(value = "X-Owner-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID ownerId) {

        LinkResponse response = urlService.updateLink(code, request, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Link updated", response));
    }

    @GetMapping("/me")
    @Operation(summary = "List current user's links")
    public ResponseEntity<ApiResponse<Page<LinkResponse>>> getUserLinks(
            @RequestHeader(value = "X-Owner-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<LinkResponse> links = urlService.getUserLinks(ownerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(links));
    }

    @GetMapping("/me/cursor")
    @Operation(summary = "List current user's links (cursor-based)")
    public ResponseEntity<ApiResponse<List<LinkResponse>>> getUserLinksCursor(
            @RequestHeader(value = "X-Owner-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID ownerId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {

        List<LinkResponse> links = urlService.getUserLinksWithCursor(ownerId, cursor, size);
        return ResponseEntity.ok(ApiResponse.success(links));
    }

    @GetMapping("/{code}/exists")
    @Operation(summary = "Check alias availability")
    public ResponseEntity<ApiResponse<AliasCheckResponse>> checkAlias(@PathVariable String code) {
        boolean available = urlService.isAliasAvailable(code);
        AliasCheckResponse response = AliasCheckResponse.builder()
                .alias(code)
                .available(available)
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
