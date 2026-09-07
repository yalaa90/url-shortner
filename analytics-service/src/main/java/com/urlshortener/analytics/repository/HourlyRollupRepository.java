package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.model.HourlyRollup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface HourlyRollupRepository extends JpaRepository<HourlyRollup, java.util.UUID> {

    Optional<HourlyRollup> findByShortCodeAndBucketStart(String shortCode, Instant bucketStart);

    @Query("SELECT COALESCE(SUM(r.clickCount), 0) FROM HourlyRollup r WHERE r.shortCode = :code AND r.bucketStart BETWEEN :from AND :to")
    long totalClicks(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COALESCE(SUM(r.uniqueVisitors), 0) FROM HourlyRollup r WHERE r.shortCode = :code AND r.bucketStart BETWEEN :from AND :to")
    long totalUniqueVisitors(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    List<HourlyRollup> findByShortCodeAndBucketStartBetweenOrderByBucketStartAsc(
            String code, Instant from, Instant to);
}