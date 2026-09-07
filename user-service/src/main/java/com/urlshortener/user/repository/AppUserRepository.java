package com.urlshortener.user.repository;

import com.urlshortener.user.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findBySubjectId(String subjectId);

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsBySubjectId(String subjectId);
}