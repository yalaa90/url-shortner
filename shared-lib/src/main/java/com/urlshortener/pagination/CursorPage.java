package com.urlshortener.pagination;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CursorPage<T> {

    private List<T> data;
    private String nextCursor;
    private boolean hasMore;
    private int size;

    public static <T> CursorPage<T> of(List<T> data, String nextCursor, boolean hasMore, int size) {
        return CursorPage.<T>builder()
                .data(data)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .size(size)
                .build();
    }

    public static <T> CursorPage<T> empty(int size) {
        return CursorPage.<T>builder()
                .data(List.of())
                .nextCursor(null)
                .hasMore(false)
                .size(size)
                .build();
    }
}
