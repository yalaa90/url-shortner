package com.urlshortener.url.config.datasource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DataSourceContextHolderTest {

    @AfterEach
    void tearDown() {
        DataSourceContextHolder.clear();
    }

    @Test
    void initiallyReturnsNull() {
        assertNull(DataSourceContextHolder.get());
    }

    @Test
    void setLeaderSetsLeader() {
        DataSourceContextHolder.setLeader();
        assertEquals(DataSourceContextHolder.LEADER, DataSourceContextHolder.get());
    }

    @Test
    void setFollowerSetsFollower() {
        DataSourceContextHolder.setFollower();
        assertEquals(DataSourceContextHolder.FOLLOWER, DataSourceContextHolder.get());
    }

    @Test
    void clearRemovesContext() {
        DataSourceContextHolder.setLeader();
        DataSourceContextHolder.clear();
        assertNull(DataSourceContextHolder.get());
    }
}
