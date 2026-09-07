package com.urlshortener.url.repository;

import com.urlshortener.url.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

    Optional<ClickEvent> findByEventId(String eventId);

    long countByShortCodeAndCreatedAtBetween(String shortCode, Instant from, Instant to);

    @Query("SELECT c.referrer, COUNT(c) FROM ClickEvent c WHERE c.shortCode = :code GROUP BY c.referrer ORDER BY COUNT(c) DESC")
    List<Object[]> countByReferrer(@Param("code") String code);

    @Query("SELECT c.country, COUNT(c) FROM ClickEvent c WHERE c.shortCode = :code GROUP BY c.country ORDER BY COUNT(c) DESC")
    List<Object[]> countByCountry(@Param("code") String code);

    @Query("SELECT FUNCTION('DATE_TRUNC', 'hour', c.createdAt), COUNT(c) FROM ClickEvent c WHERE c.shortCode = :code AND c.createdAt BETWEEN :from AND :to GROUP BY FUNCTION('DATE_TRUNC', 'hour', c.createdAt) ORDER BY 1")
    List<Object[]> hourlyClicks(@Param("code") String code, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT c.userAgent, COUNT(c) FROM ClickEvent c WHERE c.shortCode = :code GROUP BY c.userAgent ORDER BY COUNT(c) DESC LIMIT 10")
    List<Object[]> topUserAgents(@Param("code") String code);

    boolean existsByEventId(String eventId);
}
