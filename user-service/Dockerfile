# syntax=docker/dockerfile:1.4
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY shared-lib/pom.xml shared-lib/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY url-service/pom.xml url-service/pom.xml
COPY analytics-service/pom.xml analytics-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -pl user-service -am -DskipTests

COPY shared-lib shared-lib
COPY user-service user-service
RUN --mount=type=cache,target=/root/.m2 mvn package -pl user-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /build/user-service/target/*.jar app.jar
USER app
EXPOSE 8083
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
