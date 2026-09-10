package com.urlshortener.url.repository;

import com.urlshortener.url.model.ShortUrl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShortUrlRepository extends JpaRepository<ShortUrl, Long> {

    Optional<ShortUrl> findByShortCode(String shortCode);

    Optional<ShortUrl> findByCustomAlias(String customAlias);

    Optional<ShortUrl> findByShortCodeOrCustomAlias(String code, String alias);

    @Query("SELECT s FROM ShortUrl s WHERE s.ownerId = :ownerId AND s.active = true ORDER BY s.createdAt DESC")
    Page<ShortUrl> findByOwnerId(@Param("ownerId") java.util.UUID ownerId, Pageable pageable);

    @Query("SELECT s FROM ShortUrl s WHERE s.ownerId = :ownerId ORDER BY s.createdAt DESC")
    Page<ShortUrl> findAllByOwnerId(@Param("ownerId") java.util.UUID ownerId, Pageable pageable);

    @Query("SELECT s FROM ShortUrl s WHERE s.ownerId = :ownerId AND s.shortCode > :cursor ORDER BY s.shortCode ASC")
    List<ShortUrl> findByOwnerIdWithCursor(@Param("ownerId") java.util.UUID ownerId,
                                            @Param("cursor") String cursor,
                                            Pageable pageable);

    boolean existsByShortCode(String shortCode);

    boolean existsByCustomAlias(String customAlias);

    @Modifying
    @Query("UPDATE ShortUrl s SET s.active = false, s.deactivatedAt = :now WHERE s.shortCode = :code")
    int deactivateByCode(@Param("code") String code, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE ShortUrl s SET s.expiresAt = :expiresAt WHERE s.shortCode = :code")
    int updateExpiration(@Param("code") String code, @Param("expiresAt") Instant expiresAt);

    @Modifying
    @Query("UPDATE ShortUrl s SET s.customAlias = :alias WHERE s.shortCode = :code")
    int updateCustomAlias(@Param("code") String code, @Param("alias") String alias);

    @Query("SELECT COUNT(s) FROM ShortUrl s WHERE s.ownerId = :ownerId AND s.active = true")
    long countActiveByOwnerId(@Param("ownerId") java.util.UUID ownerId);

    @Query("SELECT s FROM ShortUrl s WHERE s.shortCode = :code AND s.active = true AND (s.expiresAt IS NULL OR s.expiresAt > :now)")
    Optional<ShortUrl> findActiveCode(@Param("code") String code, @Param("now") Instant now);
}
