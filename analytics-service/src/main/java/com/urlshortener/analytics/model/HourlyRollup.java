package com.urlshortener.analytics.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "hourly_rollups", indexes = {
        @Index(name = "idx_hourly_code_ts", columnList = "shortCode, bucketStart", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlyRollup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String shortCode;

    @Column(nullable = false)
    private Instant bucketStart;

    @Column(nullable = false)
    private long clickCount;

    @Column(nullable = false)
    private long uniqueVisitors;

    private String topReferrer;

    private String topCountry;
}