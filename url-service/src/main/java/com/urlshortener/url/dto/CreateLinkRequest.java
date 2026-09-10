package com.urlshortener.url.dto;

import com.urlshortener.validation.ValidUrl;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLinkRequest {

    @NotBlank(message = "URL is required")
    @ValidUrl(message = "Must be a valid HTTP/HTTPS URL")
    @Size(max = 2048, message = "URL must not exceed 2048 characters")
    private String url;

    @Size(min = 3, max = 64, message = "Alias must be between 3 and 64 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Alias can only contain letters, numbers, hyphens, and underscores")
    private String customAlias;

    private Instant expiresAt;

    @Size(max = 128, message = "Idempotency key must not exceed 128 characters")
    private String idempotencyKey;
}
