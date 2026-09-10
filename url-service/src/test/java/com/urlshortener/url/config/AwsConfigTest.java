package com.urlshortener.url.config;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;

import static org.junit.jupiter.api.Assertions.*;

class AwsConfigTest {

    @Test
    void createsSqsAsyncClient() {
        AwsConfig config = new AwsConfig();

        try (SqsAsyncClient client = config.sqsAsyncClient()) {
            assertNotNull(client);
        }
    }
}
