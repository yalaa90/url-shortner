package com.urlshortener.url.config.datasource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DynamicDataSourceTest {

    @AfterEach
    void tearDown() {
        DataSourceContextHolder.clear();
    }

    private static class ExposedDynamicDataSource extends DynamicDataSource {
        public Object lookupKey() {
            return determineCurrentLookupKey();
        }
    }

    @Test
    void defaultsToLeaderWhenNoContext() {
        ExposedDynamicDataSource ds = new ExposedDynamicDataSource();

        assertEquals(DataSourceContextHolder.LEADER, ds.lookupKey());
    }

    @Test
    void returnsLeaderWhenContextIsLeader() {
        ExposedDynamicDataSource ds = new ExposedDynamicDataSource();
        DataSourceContextHolder.setLeader();

        assertEquals(DataSourceContextHolder.LEADER, ds.lookupKey());
    }

    @Test
    void returnsFollowerWhenContextIsFollower() {
        ExposedDynamicDataSource ds = new ExposedDynamicDataSource();
        DataSourceContextHolder.setFollower();

        assertEquals(DataSourceContextHolder.FOLLOWER, ds.lookupKey());
    }
}
