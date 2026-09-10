package com.urlshortener.url.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "click_events", indexes = {
        @Index(name = "idx_click_short_code", columnList = "shortCode"),
        @Index(name = "idx_click_event_id", columnList = "eventId", unique = true),
        @Index(name = "idx_click_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClickEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String shortCode;

    @Column(nullable = false, unique = true)
    private String eventId;

    private String ipAddress;

    private String userAgent;

    private String referrer;

    private String country;

    private String city;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
