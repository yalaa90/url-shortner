# Leader-Follower Database Routing for url-service

## Goal
Implement read/write splitting in `url-service`: writes go to the leader (primary) PostgreSQL, reads go to the follower (read replica).

## Approach
Spring `AbstractRoutingDataSource` + ThreadLocal context holder + AOP via annotations (`@LeaderDataSource` / `@FollowerDataSource`). No new Maven dependencies (`spring-boot-starter-aop` already present).

## New Files (in `url-service/src/main/java/com/urlshortener/url/config/datasource/`)
1. `DataSourceContextHolder.java` — ThreadLocal storing `"leader"` / `"follower"`; static `setLeader()`, `setFollower()`, `get()`, `clear()`.
2. `DynamicDataSource.java` — extends `AbstractRoutingDataSource`; `determineCurrentLookupKey()` returns holder value, defaults to leader.
3. `LeaderDataSource.java` — `@Target(METHOD)` annotation.
4. `FollowerDataSource.java` — `@Target(METHOD)` annotation.
5. `DataSourceRoutingAspect.java` — `@Around` aspect: reads annotation, sets context, runs, clears in finally.
6. `DatasourceConfig.java` — reads `spring.datasource.leader.*` / `spring.datasource.follower.*`; creates two `HikariDataSource` beans, a `DynamicDataSource` (`@Primary`) with target map `{leader, follower}`, and `@Primary` `JpaTransactionManager` + `EntityManagerFactory` bound to the routing datasource. Flyway configured only on the leader datasource.

## Modified Files
- `application.yml` — split `spring.datasource` into `spring.datasource.leader.*` and `spring.datasource.follower.*` (both localhost:5432/urlshortener; follower same DB for dev).
- `application-docker.yml` — leader uses `url_service` schema (currentSchema + Flyway schemas); follower same endpoint (no replica locally).
- `application-prod.yml` — leader `${DB_LEADER_HOST}`, follower `${DB_FOLLOWER_HOST}`; both use `${DB_USERNAME}`/`${DB_PASSWORD}`.
- `ShortUrlRepository.java` — `@LeaderDataSource` on all `@Modifying`/write methods.
- `ClickEventRepository.java` — `@LeaderDataSource` on the interface (all writes from ClickEventPublisher).
- `UrlService.java`:
  - `createLink`, `deactivateLink`, `updateLink` → `@LeaderDataSource`
  - `resolveUrl`, `getLink`, `getUserLinks`, `getUserLinksWithCursor`, `isAliasAvailable` → `@FollowerDataSource`
- `ClickEventPublisher.java` — add `@LeaderDataSource` on `publishClickEvent` (async; sets context in its own thread).
- `infra/terraform/modules/rds/main.tf` — add `aws_db_instance.replica` (read replica, `replicate_source_db` = primary, same SG for EKS access).
- `k8s/helm-charts/url-service/values.yaml` — add `DB_FOLLOWER_HOST` config.

## Routing Summary
| Method | DS | Annotation |
|---|---|---|
| createLink / deactivateLink / updateLink | Leader | @LeaderDataSource |
| resolveUrl / getLink / getUserLinks / getUserLinksWithCursor / isAliasAvailable | Follower | @FollowerDataSource |
| ClickEventPublisher.publishClickEvent | Leader | @LeaderDataSource |
| Flyway migrations | Leader only | config |

## Notes
- Local dev follower = same DB (no real replica); production = AWS RDS Read Replica (streaming replication).
- No Flyway on follower; DDL arrives via replication.
- `@Primary` routing datasource keeps existing DI intact.
- Verify with `mvn -pl url-service compile`.
