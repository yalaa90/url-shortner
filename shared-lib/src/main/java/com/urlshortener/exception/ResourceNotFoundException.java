package com.urlshortener.exception;

import org.springframework.http.HttpStatus;

import java.net.URI;

public class ResourceNotFoundException extends ProblemDetailException {

    public ResourceNotFoundException(String resource, String field, String value) {
        super(HttpStatus.NOT_FOUND, "Not Found",
                String.format("%s with %s '%s' not found", resource, field, value),
                URI.create("https://api.urlshortener.com/errors/not-found"),
                java.util.Map.of("resource", resource, "field", field, "value", value));
    }
}
