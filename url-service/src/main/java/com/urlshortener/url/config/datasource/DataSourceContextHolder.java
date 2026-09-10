package com.urlshortener.url.config.datasource;

public final class DataSourceContextHolder {

    public static final String LEADER = "leader";
    public static final String FOLLOWER = "follower";

    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    private DataSourceContextHolder() {
    }

    public static void setLeader() {
        CONTEXT.set(LEADER);
    }

    public static void setFollower() {
        CONTEXT.set(FOLLOWER);
    }

    public static String get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}