package com.urlshortener.url;

import com.urlshortener.url.model.ShortUrl;
import com.urlshortener.url.repository.ShortUrlRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ShortUrlRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ShortUrlRepository shortUrlRepository;

    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        shortUrlRepository.deleteAll();
    }

    @Test
    void saveAndFindByShortCode() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        shortUrlRepository.save(url);

        Optional<ShortUrl> found = shortUrlRepository.findByShortCode("abc1234");
        assertTrue(found.isPresent());
        assertEquals("https://example.com", found.get().getOriginalUrl());
    }

    @Test
    void findActiveCodeReturnsOnlyActiveNotNull() {
        ShortUrl activeUrl = ShortUrl.builder()
                .shortCode("aaaa111")
                .originalUrl("https://active.example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        ShortUrl inactiveUrl = ShortUrl.builder()
                .shortCode("bbbb222")
                .originalUrl("https://inactive.example.com")
                .ownerId(OWNER_ID)
                .active(false)
                .createdAt(Instant.now())
                .build();

        ShortUrl expiredUrl = ShortUrl.builder()
                .shortCode("cccc333")
                .originalUrl("https://expired.example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().minusSeconds(60))
                .build();

        shortUrlRepository.saveAll(java.util.List.of(activeUrl, inactiveUrl, expiredUrl));

        assertTrue(shortUrlRepository.findActiveCode("aaaa111", Instant.now()).isPresent());
        assertTrue(shortUrlRepository.findActiveCode("bbbb222", Instant.now()).isEmpty());
        assertTrue(shortUrlRepository.findActiveCode("cccc333", Instant.now()).isEmpty());
    }

    @Test
    void customAliasUniquenessEnforced() {
        ShortUrl url1 = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://one.example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .customAlias("shared-alias")
                .build();

        ShortUrl url2 = ShortUrl.builder()
                .shortCode("xyz9999")
                .originalUrl("https://two.example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .customAlias("other-alias")
                .build();

        shortUrlRepository.save(url1);
        shortUrlRepository.save(url2);

        assertTrue(shortUrlRepository.existsByCustomAlias("shared-alias"));
        assertTrue(shortUrlRepository.findByCustomAlias("shared-alias").isPresent());
        assertFalse(shortUrlRepository.existsByShortCode("shared-alias"));
    }

    @Test
    void deactivateByCodePerformsSoftDelete() {
        ShortUrl url = ShortUrl.builder()
                .shortCode("abc1234")
                .originalUrl("https://example.com")
                .ownerId(OWNER_ID)
                .active(true)
                .createdAt(Instant.now())
                .build();

        shortUrlRepository.save(url);
        int updated = shortUrlRepository.deactivateByCode("abc1234", Instant.now());

        assertEquals(1, updated);
        assertTrue(shortUrlRepository.findByShortCode("abc1234").get().isActive() == false);
    }
}