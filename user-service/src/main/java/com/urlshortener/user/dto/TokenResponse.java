package com.urlshortener.user.dto;

public record TokenResponse(
        String access_token,
        String token_type,
        long expires_in,
        String refresh_token
) {
}