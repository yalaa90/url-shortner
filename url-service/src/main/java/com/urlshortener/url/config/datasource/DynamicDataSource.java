package com.urlshortener.url.config.datasource;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class DynamicDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        String key = DataSourceContextHolder.get();
        return key != null ? key : DataSourceContextHolder.LEADER;
    }
}