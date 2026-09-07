package com.urlshortener.analytics.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "daily_compactions", indexes = {
        @Index(name = "idx_daily_code_ts", columnList = "shortCode, bucketStart", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCompaction {

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

    @Column(length = 2048)
    private String topReferrer;

    @Column(length = 18)
    private String topCountry;
}