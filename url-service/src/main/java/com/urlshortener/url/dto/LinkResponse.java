package com.urlshortener.url.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkResponse {

    private Long id;
    private String shortCode;
    private String shortUrl;
    private String originalUrl;
    private String customAlias;
    private boolean active;
    private Instant createdAt;
    private Instant expiresAt;
    private long clickCount;
}
