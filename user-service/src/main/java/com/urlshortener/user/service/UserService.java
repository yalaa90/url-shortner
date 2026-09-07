package com.urlshortener.user.service;

import com.urlshortener.exception.ConflictException;
import com.urlshortener.exception.ResourceNotFoundException;
import com.urlshortener.user.dto.CreateUserRequest;
import com.urlshortener.user.dto.UpdateUserRequest;
import com.urlshortener.user.dto.UserResponse;
import com.urlshortener.user.mapper.UserMapper;
import com.urlshortener.user.model.AppUser;
import com.urlshortener.user.repository.AppUserRepository;
import com.urlshortener.user.security.PasswordPolicyValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository appUserRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (appUserRepository.existsBySubjectId(request.getSubjectId())) {
            throw new ConflictException("User already exists",
                    java.util.Map.of("field", "subjectId", "value", request.getSubjectId()));
        }
        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered",
                    java.util.Map.of("field", "email"));
        }

        if (request.getPassword() != null) {
            PasswordPolicyValidator.validate(request.getPassword());
        }

        AppUser user = AppUser.builder()
                .subjectId(request.getSubjectId())
                .email(request.getEmail())
                .displayName(request.getDisplayName())
                .phone(request.getPhone())
                .roles(Set.of("ROLE_USER"))
                .build();

        user = appUserRepository.save(user);
        log.info("User created: subjectId={}, email={}", user.getSubjectId(), user.getEmail());

        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(String subjectId) {
        AppUser user = findBySubjectId(subjectId);
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String subjectId, UpdateUserRequest request) {
        AppUser user = findBySubjectId(subjectId);

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(request.getRoles());
        }

        user.setEnabled(request.isEnabled());
        user = appUserRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional
    public void deleteUser(String subjectId) {
        AppUser user = findBySubjectId(subjectId);
        appUserRepository.delete(user);
        log.info("User deleted: subjectId={}", subjectId);
    }

    @Transactional(readOnly = true)
    public String findOwnerBySubject(String subjectId) {
        return findBySubjectId(subjectId).getId().toString();
    }

    @Transactional
    public AppUser syncUserFromIdentityProvider(String subjectId, String email, String displayName) {
        return appUserRepository.findBySubjectId(subjectId)
                .map(existing -> {
                    existing.setEmail(email);
                    if (displayName != null) {
                        existing.setDisplayName(displayName);
                    }
                    return appUserRepository.save(existing);
                })
                .orElseGet(() -> {
                    AppUser user = AppUser.builder()
                            .subjectId(subjectId)
                            .email(email)
                            .displayName(displayName)
                            .roles(Set.of("ROLE_USER"))
                            .build();
                    return appUserRepository.save(user);
                });
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listAllUsers() {
        return appUserRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    private AppUser findBySubjectId(String subjectId) {
        return appUserRepository.findBySubjectId(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "subjectId", subjectId));
    }
}