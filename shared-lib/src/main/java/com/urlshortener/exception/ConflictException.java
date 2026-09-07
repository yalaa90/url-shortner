package com.urlshortener.exception;

import org.springframework.http.HttpStatus;

import java.net.URI;
import java.util.Map;

public class ConflictException extends ProblemDetailException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, "Conflict", message,
                URI.create("https://api.urlshortener.com/errors/conflict"), Map.of());
    }

    public ConflictException(String message, Map<String, Object> properties) {
        super(HttpStatus.CONFLICT, "Conflict", message,
                URI.create("https://api.urlshortener.com/errors/conflict"), properties);
    }
}
