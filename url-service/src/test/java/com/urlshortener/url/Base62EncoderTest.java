package com.urlshortener.url;

import com.urlshortener.url.encoding.Base62Encoder;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class Base62EncoderTest {

    private final Base62Encoder encoder = new Base62Encoder();

    @Test
    void encodeDecodeRoundTrip() {
        long value = 123456789L;
        String encoded = encoder.encode(value);
        assertEquals(value, encoder.decode(encoded));
    }

    @Test
    void encodeZero() {
        assertEquals("0000000", encoder.encode(0));
    }

    @Test
    void generatedCodeHasCorrectLength() {
        String code = encoder.generateRandom();
        assertEquals(7, code.length());
    }

    @Test
    void generatedCodesAreAlphanumeric() {
        String code = encoder.generateRandom();
        assertTrue(code.matches("^[0-9A-Za-z]{7}$"));
    }

    @Test
    void generatedCodesAreUnique() {
        var codes = new java.util.HashSet<String>();
        for (int i = 0; i < 1000; i++) {
            codes.add(encoder.generateRandom());
        }
        assertEquals(1000, codes.size());
    }

    @Test
    void batchGenerationProducesDistinctCodes() {
        var codes = encoder.generateBatch(100);
        assertEquals(100, codes.size());
        assertEquals(100, new java.util.HashSet<>(codes).size());
    }

    @Test
    void isValidCodeAcceptsValid() {
        assertTrue(encoder.isValidCode("aBc1234"));
    }

    @Test
    void isValidCodeRejectsInvalid() {
        assertFalse(encoder.isValidCode("ab-cd!/"));
        assertFalse(encoder.isValidCode(""));
        assertFalse(encoder.isValidCode(null));
    }

    @Test
    void encodeHighValue() {
        // Max value for 7 char base62: 62^7 - 1
        long max = (long) Math.pow(62, 7) - 1;
        String encoded = encoder.encode(max);
        assertEquals(7, encoded.length());
        assertEquals(max, encoder.decode(encoded));
    }
}