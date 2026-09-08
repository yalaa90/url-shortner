package com.urlshortener.user.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.security.jwt.issuer}")
    private String expectedIssuer;

    @Value("${app.security.jwt.public-key}")
    private String publicKeyPem;

    private volatile RSAPublicKey cachedPublicKey;

    @SuppressWarnings("unchecked")
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(getPublicKey())
                    .requireIssuer(expectedIssuer)
                    .build()
                    .parseSignedClaims(token);

            Claims claims = jws.getPayload();
            String subject = claims.getSubject();
            List<String> roles = extractRoles(claims.get("realm_access", Map.class));

            var authorities = roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());

            var userPrincipal = User.withUsername(subject)
                    .password("")
                    .authorities(authorities)
                    .build();

            var authentication = new UsernamePasswordAuthenticationToken(
                    userPrincipal, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private List<String> extractRoles(Map<String, Object> realmAccess) {
        if (realmAccess != null) {
            Object roles = realmAccess.get("roles");
            if (roles instanceof List<?> roleList) {
                return roleList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .toList();
            }
        }
        return List.of();
    }

    private RSAPublicKey getPublicKey() throws Exception {
        if (cachedPublicKey != null) {
            return cachedPublicKey;
        }
        byte[] keyBytes = Base64.getDecoder().decode(
                publicKeyPem
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", ""));
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        PublicKey key = KeyFactory.getInstance("RSA").generatePublic(spec);
        cachedPublicKey = (RSAPublicKey) key;
        return cachedPublicKey;
    }
}