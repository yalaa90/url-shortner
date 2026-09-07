package com.urlshortener.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.URI;
import java.net.URISyntaxException;

public class UrlValidator implements ConstraintValidator<ValidUrl, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            return (scheme != null) &&
                   (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https")) &&
                   uri.getHost() != null &&
                   !uri.getHost().isBlank();
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
