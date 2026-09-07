package com.urlshortener.url.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "short_urls", indexes = {
        @Index(name = "idx_short_code", columnList = "shortCode", unique = true),
        @Index(name = "idx_owner_id", columnList = "ownerId"),
        @Index(name = "idx_custom_alias", columnList = "customAlias", unique = true),
        @Index(name = "idx_active_expires", columnList = "active, expiresAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {})
public class ShortUrl {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "short_url_seq")
    @SequenceGenerator(name = "short_url_seq", sequenceName = "short_url_id_seq", allocationSize = 100)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String shortCode;

    @Column(nullable = false, length = 2048)
    private String originalUrl;

    @Column(unique = true, length = 64)
    private String customAlias;

    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID ownerId;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant expiresAt;

    private Instant deactivatedAt;

    @Column(length = 64)
    private String encryptedOriginalUrl;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (!active) {
            active = true;
        }
    }

    public String getEffectiveCode() {
        return customAlias != null ? customAlias : shortCode;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean isActiveAndValid() {
        return active && !isExpired();
    }
}
