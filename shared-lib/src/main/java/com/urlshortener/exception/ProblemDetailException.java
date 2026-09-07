package com.urlshortener.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import java.net.URI;
import java.util.Map;

@Getter
public class ProblemDetailException extends RuntimeException {

    private final HttpStatus status;
    private final URI type;
    private final Map<String, Object> properties;

    public ProblemDetailException(HttpStatus status, String title, String detail,
                                   URI type, Map<String, Object> properties) {
        super(detail);
        this.status = status;
        this.type = type;
        this.properties = properties != null ? properties : Map.of();
    }

    public ProblemDetail toProblemDetail() {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, getMessage());
        problem.setTitle(status.getReasonPhrase());
        problem.setType(type);
        properties.forEach(problem::setProperty);
        return problem;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private HttpStatus status = HttpStatus.BAD_REQUEST;
        private String title = "Error";
        private String detail;
        private URI type;
        private Map<String, Object> properties;

        public Builder status(HttpStatus status) {
            this.status = status;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder detail(String detail) {
            this.detail = detail;
            return this;
        }

        public Builder type(URI type) {
            this.type = type;
            return this;
        }

        public Builder properties(Map<String, Object> properties) {
            this.properties = properties;
            return this;
        }

        public ProblemDetailException build() {
            return new ProblemDetailException(status, title, detail, type, properties);
        }
    }
}
