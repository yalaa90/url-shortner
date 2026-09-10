package com.urlshortener.url.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.dto.UpdateLinkRequest;
import com.urlshortener.url.service.UrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.config.SpringDataJacksonConfiguration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UrlControllerTest {

    @Mock
    private UrlService urlService;

    @InjectMocks
    private UrlController urlController;

    private MockMvc mockMvc;

    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = Jackson2ObjectMapperBuilder.json().build();
        objectMapper.registerModule(new SpringDataJacksonConfiguration.PageModule());
        MappingJackson2HttpMessageConverter converter =
                new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(urlController)
                .setMessageConverters(converter)
                .build();
    }

    private LinkResponse linkResponse(String code) {
        return LinkResponse.builder()
                .id(1L)
                .shortCode(code)
                .shortUrl("http://localhost:8080/" + code)
                .originalUrl("https://example.com")
                .active(true)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void createLinkReturnsCreatedWithLocation() throws Exception {
        LinkResponse response = linkResponse("abc1234");
        when(urlService.createLink(any(CreateLinkRequest.class), eq(OWNER_ID))).thenReturn(response);

        mockMvc.perform(post("/api/v1/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com\"}")
                        .header("X-Owner-Id", OWNER_ID.toString()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/links/abc1234"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shortCode").value("abc1234"));
    }

    @Test
    void resolveRedirectReturns301WithLocation() throws Exception {
        when(urlService.redirectAndTrack(eq("abc1234"), any(), any(), any())).thenReturn("https://example.com");

        mockMvc.perform(get("/api/v1/links/abc1234")
                        .header("X-Forwarded-For", "1.2.3.4")
                        .header("User-Agent", "test-agent")
                        .header("Referer", "https://ref.com"))
                .andExpect(status().isMovedPermanently())
                .andExpect(header().string("Location", "https://example.com"));
    }

    @Test
    void getLinkReturnsDetails() throws Exception {
        when(urlService.getLink("abc1234")).thenReturn(linkResponse("abc1234"));

        mockMvc.perform(get("/api/v1/links/abc1234/details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.shortCode").value("abc1234"))
                .andExpect(jsonPath("$.data.originalUrl").value("https://example.com"));
    }

    @Test
    void deactivateLinkReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/links/abc1234")
                        .header("X-Owner-Id", OWNER_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void updateLinkReturnsOk() throws Exception {
        when(urlService.updateLink(eq("abc1234"), any(UpdateLinkRequest.class), eq(OWNER_ID)))
                .thenReturn(linkResponse("new-alias"));

        mockMvc.perform(patch("/api/v1/links/abc1234")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customAlias\":\"new-alias\"}")
                        .header("X-Owner-Id", OWNER_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.shortCode").value("new-alias"));
    }

    @Test
    void getUserLinksReturnsPage() throws Exception {
        Page<LinkResponse> page = new PageImpl<>(List.of(linkResponse("abc1234")));
        when(urlService.getUserLinks(eq(OWNER_ID), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/v1/links/me")
                        .header("X-Owner-Id", OWNER_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].shortCode").value("abc1234"));
    }

    @Test
    void getUserLinksCursorReturnsList() throws Exception {
        when(urlService.getUserLinksWithCursor(eq(OWNER_ID), isNull(), eq(20)))
                .thenReturn(List.of(linkResponse("abc1234")));

        mockMvc.perform(get("/api/v1/links/me/cursor")
                        .header("X-Owner-Id", OWNER_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].shortCode").value("abc1234"));
    }

    @Test
    void checkAliasReturnsAvailability() throws Exception {
        when(urlService.isAliasAvailable("free123")).thenReturn(true);

        mockMvc.perform(get("/api/v1/links/free123/exists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alias").value("free123"))
                .andExpect(jsonPath("$.data.available").value(true));
    }
}
