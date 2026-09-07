package com.urlshortener.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Subject ID is required")
    @Size(max = 128)
    private String subjectId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 320)
    private String email;

    @Size(max = 128)
    private String displayName;

    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Invalid phone number")
    private String phone;

    @Size(max = 64)
    private String password;
}