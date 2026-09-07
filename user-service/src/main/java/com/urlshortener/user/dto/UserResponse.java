package com.urlshortener.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String email;
    private String displayName;
    private String phone;
    private boolean emailVerified;
    private boolean enabled;
    private Set<String> roles;
    private Instant createdAt;
}