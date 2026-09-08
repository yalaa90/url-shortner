package com.urlshortener.user.controller;

import com.urlshortener.exception.ProblemDetailException;
import com.urlshortener.user.dto.TokenResponse;
import com.urlshortener.user.model.AppUser;
import com.urlshortener.user.repository.AppUserRepository;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String CLIENT_ID = "url-shortener-ui";
    private static final Duration TOKEN_TTL = Duration.ofHours(1);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.jwt.issuer}")
    private String issuer;

    @Value("${app.security.jwt.private-key:}")
    private String privateKeyPem;

    @Value("${app.dev.login.email:}")
    private String devEmail;

    @Value("${app.dev.login.password-hash:}")
    private String devPasswordHash;

    @PostMapping("/token")
    public ResponseEntity<TokenResponse> token(
            @RequestParam(value = "grant_type", required = false) String grantType,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "client_id", defaultValue = CLIENT_ID) String clientId) {

        if (!"password".equals(grantType)) {
            throw ProblemDetailException.builder()
                    .status(HttpStatus.BAD_REQUEST)
                    .title("Unsupported grant type")
                    .detail("Only grant_type=password is supported in this environment")
                    .build();
        }
        if (!CLIENT_ID.equals(clientId)) {
            throw unauthorized();
        }

        AppUser user = authenticate(username, password);
        return ResponseEntity.ok(issueToken(user));
    }

    private AppUser authenticate(String username, String password) {
        if (username == null || password == null || !username.equals(devEmail)) {
            throw unauthorized();
        }
        if (privateKeyPem == null || privateKeyPem.isBlank()) {
            throw new IllegalStateException("Local login is not configured; missing app.security.jwt.private-key");
        }
        if (!passwordEncoder.matches(password, devPasswordHash)) {
            throw unauthorized();
        }
        return appUserRepository.findByEmail(username)
                .orElseThrow(this::unauthorized);
    }

    private TokenResponse issueToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(TOKEN_TTL);

        Date issuedAt = Date.from(now);
        Date expiration = Date.from(expiresAt);

        String token = Jwts.builder()
                .issuer(issuer)
                .subject(user.getSubjectId())
                .claim("email", user.getEmail())
                .claim("name", user.getDisplayName())
                .claim("realm_access", Map.of("roles", List.of("USER")))
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(getPrivateKey())
                .compact();

        log.info("Issued local dev token for email={}, subjectId={}", user.getEmail(), user.getSubjectId());
        return new TokenResponse(
                token,
                "Bearer",
                TOKEN_TTL.toSeconds(),
                null);
    }

    private PrivateKey getPrivateKey() {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(privateKeyPem.trim());
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePrivate(spec);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load signing key", e);
        }
    }

    private ProblemDetailException unauthorized() {
        return ProblemDetailException.builder()
                .status(HttpStatus.UNAUTHORIZED)
                .title("Authentication failed")
                .detail("Invalid username or password")
                .build();
    }
}