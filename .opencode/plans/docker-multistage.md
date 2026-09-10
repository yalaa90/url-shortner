# Plan: Fix Docker Compose build failure — Multi-stage Java Dockerfiles

## Problem
`docker compose build` fails for `url-service` (and the other Java services) with:
`lstat /target: no such file or directory`

**Root cause:** Each Java service Dockerfile is single-stage and does
`COPY target/*.jar app.jar`, expecting a pre-built JAR. The `target/` dirs only
contain compiled classes (never packaged), and `target/*.jar` doesn't match when
no JAR exists. Additionally, the build context is `./<service>`, which excludes
the sibling `shared-lib` module and parent POM each service depends on.

## Changes

### 1. `docker-compose.yml`
Change the build context for the 4 Java services (url-service, analytics-service,
user-service, api-gateway) from the service dir to the repo root with an explicit
Dockerfile path, so the multi-stage build has access to parent POM + shared-lib:

```yaml
# from
build:
  context: ./url-service
# to
build:
  context: .
  dockerfile: url-service/Dockerfile
```
(Repeat for analytics-service, user-service, api-gateway)

### 2. Each Java service Dockerfile
Convert to multi-stage (builder + runtime). Builder uses the `maven` image to
compile/package with `-pl <service> -am` so shared-lib is built as well. Runtime
stage is unchanged (copy JAR, non-root user, ENTRYPOINT).

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# 1) Dependencies only (cache-friendly)
COPY pom.xml .
COPY shared-lib/pom.xml shared-lib/pom.xml
COPY <svc>/pom.xml <svc>/pom.xml
RUN mvn dependency:go-offline -pl <svc> -am -DskipTests

# 2) Sources + build
COPY shared-lib shared-lib
COPY <svc> <svc>
RUN mvn package -pl <svc> -am -DskipTests

# 3) Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /build/<svc>/target/*.jar app.jar
USER app
EXPOSE <PORT>
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
```

Service-specific values:
- url-service: port 8081
- analytics-service: port 8082
- user-service: port 8083
- api-gateway: port 8080

### 3. `url-shortener-ui/Dockerfile`
Already multi-stage. No changes.

## Verify
```bash
docker compose build
docker compose up -d
```
