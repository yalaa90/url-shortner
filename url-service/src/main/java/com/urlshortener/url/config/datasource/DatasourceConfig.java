package com.urlshortener.url.config.datasource;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DatasourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.leader")
    public DataSourceProperties leaderProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.follower")
    public DataSourceProperties followerProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.leader.hikari")
    public HikariDataSource leaderDataSource(@Qualifier("leaderProperties") DataSourceProperties leaderProperties) {
        return leaderProperties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.follower.hikari")
    public HikariDataSource followerDataSource(@Qualifier("followerProperties") DataSourceProperties followerProperties) {
        return followerProperties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean
    @Primary
    public DataSource routingDataSource(@Qualifier("leaderDataSource") DataSource leader,
                                        @Qualifier("followerDataSource") DataSource follower) {
        DynamicDataSource routingDataSource = new DynamicDataSource();
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceContextHolder.LEADER, leader);
        targetDataSources.put(DataSourceContextHolder.FOLLOWER, follower);
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(leader);
        return routingDataSource;
    }
}