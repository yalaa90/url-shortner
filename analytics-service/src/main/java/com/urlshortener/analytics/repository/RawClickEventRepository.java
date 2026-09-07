package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.model.RawClickEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RawClickEventRepository extends JpaRepository<RawClickEvent, java.util.UUID> {

    Optional<RawClickEvent> findByEventId(String eventId);

    boolean existsByEventId(String eventId);

    long countByShortCodeAndCreatedAtBetween(String shortCode, Instant from, Instant to);

    @Query("SELECT COUNT(DISTINCT e.ipAddress) FROM RawClickEvent e WHERE e.shortCode = :code AND e.createdAt BETWEEN :from AND :to")
    long countUniqueVisitors(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT e.referrer, COUNT(e) FROM RawClickEvent e WHERE e.shortCode = :code AND e.createdAt BETWEEN :from AND :to GROUP BY e.referrer ORDER BY COUNT(e) DESC")
    List<Object[]> topReferrers(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    @Query("SELECT e.country, COUNT(e) FROM RawClickEvent e WHERE e.shortCode = :code AND e.createdAt BETWEEN :from AND :to GROUP BY e.country ORDER BY COUNT(e) DESC")
    List<Object[]> topCountries(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    @Query("SELECT FUNCTION('DATE_TRUNC', 'hour', e.createdAt), COUNT(e) FROM RawClickEvent e WHERE e.shortCode = :code AND e.createdAt BETWEEN :from AND :to GROUP BY 1 ORDER BY 1")
    List<Object[]> hourlySeries(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);
}