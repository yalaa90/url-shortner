package com.urlshortener.load;

import io.gatling.javaapi.core.ScenarioBuilder;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.constantUsersPerSec;
import static io.gatling.javaapi.core.CoreDsl.exec;
import static io.gatling.javaapi.core.CoreDsl.jsonPath;
import static io.gatling.javaapi.core.CoreDsl.pause;
import static io.gatling.javaapi.core.CoreDsl.rampUsers;
import static io.gatling.javaapi.core.CoreDsl.scenario;
import static io.gatling.javaapi.core.CoreDsl.StringBody;
import static io.gatling.javaapi.core.CoreDsl.tryMax;
import static io.gatling.javaapi.http.HttpDsl.header;
import static io.gatling.javaapi.http.HttpDsl.http;
import static io.gatling.javaapi.http.HttpDsl.status;

public class UrlShortenerSimulation extends BaseSimulation {

    private static final int PEAK_USERS = intEnvOr("LT_USERS", 100);
    private static final Duration RAMP_DURATION = Duration.ofSeconds(longEnvOr("LT_RAMP_SECONDS", 30));
    private static final Duration STEADY_DURATION = Duration.ofSeconds(longEnvOr("LT_STEADY_SECONDS", 120));
    private static final int RESOLVE_RETRIES = intEnvOr("LT_RESOLVE_RETRIES", 3);

    private final ScenarioBuilder createAndResolve = scenario("Create and resolve short URL")
            .feed(urlFeeder())
            .exec(
                    http("create_short_url")
                            .post("/api/v1/links")
                            .header("X-Owner-Id", OWNER_ID)
                            .body(StringBody("{\"url\":\"#{targetUrl}\"}"))
                            .check(status().is(201))
                            .check(jsonPath("$.data.shortCode").saveAs("shortCode"))
            )
            .pause(Duration.ofMillis(100))
            .tryMax(RESOLVE_RETRIES).on(
                    pause(Duration.ofMillis(200)),
                    exec(
                            http("resolve_short_url")
                                    .get("/api/v1/links/#{shortCode}")
                                    .disableFollowRedirect()
                                    .check(status().is(301))
                                    .check(header("Location").notNull())
                    )
            );

    {
        setUp(
                createAndResolve.injectOpen(
                        rampUsers(PEAK_USERS).during(RAMP_DURATION),
                        constantUsersPerSec(PEAK_USERS).during(STEADY_DURATION)
                )
        ).protocols(httpProtocol);
    }
}