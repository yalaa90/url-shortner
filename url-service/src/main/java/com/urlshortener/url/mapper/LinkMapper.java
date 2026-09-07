package com.urlshortener.url.mapper;

import com.urlshortener.url.dto.CreateLinkRequest;
import com.urlshortener.url.dto.LinkResponse;
import com.urlshortener.url.model.ShortUrl;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LinkMapper {

    @Mapping(source = "effectiveCode", target = "shortCode")
    @Mapping(target = "shortUrl", ignore = true)
    @Mapping(target = "clickCount", ignore = true)
    LinkResponse toResponse(ShortUrl shortUrl);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "shortCode", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "deactivatedAt", ignore = true)
    @Mapping(target = "encryptedOriginalUrl", ignore = true)
    ShortUrl toEntity(CreateLinkRequest request);

    default String mapShortUrl(ShortUrl shortUrl) {
        return null;
    }
}
