package com.urlshortener.load;

import io.gatling.javaapi.core.ScenarioBuilder;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.constantUsersPerSec;
import static io.gatling.javaapi.core.CoreDsl.csv;
import static io.gatling.javaapi.core.CoreDsl.rampUsers;
import static io.gatling.javaapi.core.CoreDsl.scenario;
import static io.gatling.javaapi.http.HttpDsl.header;
import static io.gatling.javaapi.http.HttpDsl.http;
import static io.gatling.javaapi.http.HttpDsl.status;

public class ResolveLinkSimulation extends BaseSimulation {

    private static final int PEAK_USERS = intEnvOr("LT_USERS", 100);
    private static final Duration RAMP_DURATION = Duration.ofSeconds(longEnvOr("LT_RAMP_SECONDS", 30));
    private static final Duration STEADY_DURATION = Duration.ofSeconds(longEnvOr("LT_STEADY_SECONDS", 120));

    private final ScenarioBuilder resolve = scenario("Resolve existing short URL")
            .feed(csv("data/short-codes.csv").random())
            .exec(
                    http("resolve_short_url")
                            .get("/api/v1/links/#{shortCode}")
                            .disableFollowRedirect()
                            .check(status().is(301))
                            .check(header("Location").notNull())
            );

    {
        setUp(
                resolve.injectOpen(
                        rampUsers(PEAK_USERS).during(RAMP_DURATION),
                        constantUsersPerSec(PEAK_USERS).during(STEADY_DURATION)
                )
        ).protocols(httpProtocol);
    }
}