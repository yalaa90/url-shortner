package com.urlshortener.url.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AliasCheckResponseTest {

    @Test
    void builderAndGetters() {
        AliasCheckResponse response = AliasCheckResponse.builder()
                .alias("my-alias")
                .available(true)
                .build();

        assertEquals("my-alias", response.getAlias());
        assertTrue(response.isAvailable());
    }

    @Test
    void settersUpdateFields() {
        AliasCheckResponse response = new AliasCheckResponse();
        response.setAlias("other-alias");
        response.setAvailable(false);

        assertEquals("other-alias", response.getAlias());
        assertFalse(response.isAvailable());
    }

    @Test
    void allArgsConstructor() {
        AliasCheckResponse response = new AliasCheckResponse("my-alias", true);

        assertEquals("my-alias", response.getAlias());
        assertTrue(response.isAvailable());
    }

    @Test
    void equalsHashCodeAndToString() {
        AliasCheckResponse a = AliasCheckResponse.builder().alias("x").available(true).build();
        AliasCheckResponse b = AliasCheckResponse.builder().alias("x").available(true).build();
        AliasCheckResponse c = AliasCheckResponse.builder().alias("y").available(true).build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
        assertNotEquals(a, c);
        assertNotEquals(a, null);
        assertNotEquals(a, "x");
        assertTrue(a.toString().contains("x"));
        assertTrue(a.canEqual(b));
        assertFalse(a.canEqual("x"));
    }
}
