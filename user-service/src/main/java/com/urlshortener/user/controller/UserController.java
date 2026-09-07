package com.urlshortener.user.controller;

import com.urlshortener.dto.ApiResponse;
import com.urlshortener.user.dto.CreateUserRequest;
import com.urlshortener.user.dto.UpdateUserRequest;
import com.urlshortener.user.dto.UserResponse;
import com.urlshortener.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a user profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'API_CLIENT')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/v1/users/" + response.getId()))
                .body(ApiResponse.success("User created", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal Jwt jwt) {

        String subjectId = jwt.getSubject();
        UserResponse response = userService.getUser(subjectId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{subjectId}")
    @Operation(summary = "Get a user by subject ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable String subjectId) {
        UserResponse response = userService.getUser(subjectId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateUserRequest request) {

        UserResponse response = userService.updateUser(jwt.getSubject(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", response));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete current user")
    public ResponseEntity<ApiResponse<Void>> deleteMe(@AuthenticationPrincipal Jwt jwt) {
        userService.deleteUser(jwt.getSubject());
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    @GetMapping
    @Operation(summary = "List all users (admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> listAll() {
        List<UserResponse> responses = userService.listAllUsers();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}