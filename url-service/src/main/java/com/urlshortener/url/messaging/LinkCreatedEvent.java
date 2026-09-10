package com.urlshortener.url.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkCreatedEvent {

    private String idempotencyKey;
    private String shortCode;
    private String originalUrl;
    private String customAlias;
    private UUID ownerId;
    private boolean active;
    private Instant expiresAt;
    private Instant createdAt;
}
