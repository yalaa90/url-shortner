package com.urlshortener.user.mapper;

import com.urlshortener.user.dto.UserResponse;
import com.urlshortener.user.model.AppUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", expression = "java(appUser.getId().toString())")
    UserResponse toResponse(AppUser appUser);
}