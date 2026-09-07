package com.urlshortener.url.encoding;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@Component
public class Base62Encoder {

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int CODE_LENGTH = 7;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String encode(long value) {
        StringBuilder sb = new StringBuilder();

        if (value == 0) {
            sb.append(ALPHABET.charAt(0));
        } else {
            while (value > 0) {
                sb.append(ALPHABET.charAt((int) (value % ALPHABET.length())));
                value /= ALPHABET.length();
            }
        }

        while (sb.length() < CODE_LENGTH) {
            sb.append(ALPHABET.charAt(0));
        }

        return sb.reverse().toString();
    }

    public long decode(String code) {
        long result = 0;
        for (char c : code.toCharArray()) {
            result = result * ALPHABET.length() + ALPHABET.indexOf(c);
        }
        return result;
    }

    public String generateRandom() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    public List<String> generateBatch(int count) {
        List<String> codes = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            codes.add(generateRandom());
        }
        return codes;
    }

    public boolean isValidCode(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return code.chars().allMatch(c -> ALPHABET.indexOf(c) >= 0);
    }
}
