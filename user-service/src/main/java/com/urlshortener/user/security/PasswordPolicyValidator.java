package com.urlshortener.user.security;

import com.urlshortener.exception.ProblemDetailException;
import org.springframework.http.HttpStatus;

import java.net.URI;
import java.util.Map;

public class PasswordPolicyValidator {

    private static final URI TYPE = URI.create("https://api.urlshortener.com/errors/password-policy");

    private static final String DIGIT = ".*[0-9].*";
    private static final String LOWER = ".*[a-z].*";
    private static final String UPPER = ".*[A-Z].*";
    private static final String SPECIAL = ".*[^a-zA-Z0-9\\s].*";
    private static final String NO_WHITESPACE = "\\S+";

    public static void validate(String password) {
        StringBuilder violations = new StringBuilder();

        if (password == null || password.length() < 12) {
            violations.append("At least 12 characters required. ");
        }
        if (password != null && password.length() > 128) {
            violations.append("At most 128 characters allowed. ");
        }
        if (password != null && !password.matches(DIGIT)) {
            violations.append("At least one digit required. ");
        }
        if (password != null && !password.matches(LOWER)) {
            violations.append("At least one lowercase letter required. ");
        }
        if (password != null && !password.matches(UPPER)) {
            violations.append("At least one uppercase letter required. ");
        }
        if (password != null && !password.matches(SPECIAL)) {
            violations.append("At least one special character required. ");
        }
        if (password != null && !password.matches(NO_WHITESPACE)) {
            violations.append("Whitespace not allowed. ");
        }

        if (!violations.isEmpty()) {
            throw new ProblemDetailException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Password does not meet policy requirements",
                    violations.toString().trim(),
                    TYPE,
                    Map.of("policy", "NIST-800-63B"));
        }
    }
}