package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.model.DailyCompaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface DailyCompactionRepository extends JpaRepository<DailyCompaction, java.util.UUID> {

    boolean existsByShortCodeAndBucketStart(String shortCode, Instant bucketStart);

    @Query("SELECT COALESCE(SUM(d.clickCount), 0) FROM DailyCompaction d WHERE d.shortCode = :code AND d.bucketStart BETWEEN :from AND :to")
    long totalClicks(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COALESCE(SUM(d.uniqueVisitors), 0) FROM DailyCompaction d WHERE d.shortCode = :code AND d.bucketStart BETWEEN :from AND :to")
    long totalUniqueVisitors(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    List<DailyCompaction> findByShortCodeAndBucketStartBetweenOrderByBucketStartAsc(
            String code, Instant from, Instant to);
}