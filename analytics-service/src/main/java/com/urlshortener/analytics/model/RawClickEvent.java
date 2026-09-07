package com.urlshortener.analytics.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "raw_click_events", indexes = {
        @Index(name = "idx_raw_event_id", columnList = "eventId", unique = true),
        @Index(name = "idx_raw_short_code", columnList = "shortCode"),
        @Index(name = "idx_raw_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawClickEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

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

    @Column(nullable = false)
    private boolean processed;
}