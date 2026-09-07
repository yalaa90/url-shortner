CREATE TABLE raw_click_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code   VARCHAR(12)  NOT NULL,
    event_id     VARCHAR(64)  NOT NULL UNIQUE,
    ip_address   VARCHAR(45),
    user_agent   VARCHAR(512),
    referrer     VARCHAR(2048),
    country      VARCHAR(2),
    city         VARCHAR(128),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    processed    BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_raw_short_code ON raw_click_events (short_code);
CREATE INDEX idx_raw_created_at ON raw_click_events (created_at);
CREATE INDEX idx_raw_unprocessed ON raw_click_events (processed) WHERE processed = FALSE;

CREATE TABLE hourly_rollups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code      VARCHAR(12)  NOT NULL,
    bucket_start    TIMESTAMP    NOT NULL,
    click_count     BIGINT       NOT NULL DEFAULT 0,
    unique_visitors BIGINT       NOT NULL DEFAULT 0,
    top_referrer    VARCHAR(2048),
    top_country     VARCHAR(2)
);

CREATE UNIQUE INDEX idx_hourly_code_ts ON hourly_rollups (short_code, bucket_start);

CREATE TABLE daily_compactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code      VARCHAR(12)  NOT NULL,
    bucket_start    TIMESTAMP    NOT NULL,
    click_count     BIGINT       NOT NULL DEFAULT 0,
    unique_visitors BIGINT       NOT NULL DEFAULT 0,
    top_referrer    VARCHAR(2048),
    top_country     VARCHAR(2)
);

CREATE UNIQUE INDEX idx_daily_code_ts ON daily_compactions (short_code, bucket_start);