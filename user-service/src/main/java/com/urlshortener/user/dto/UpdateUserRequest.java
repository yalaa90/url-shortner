package com.urlshortener.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(max = 128)
    private String displayName;

    @Size(max = 128)
    private String currentPassword;

    @Size(min = 12, max = 128)
    private String newPassword;

    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Invalid phone number")
    private String phone;

    private boolean enabled;

    private Set<String> roles;
}