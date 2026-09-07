CREATE SEQUENCE short_url_id_seq START WITH 1 INCREMENT BY 100;

CREATE TABLE short_urls (
    id              BIGINT PRIMARY KEY DEFAULT nextval('short_url_id_seq'),
    short_code      VARCHAR(12)  NOT NULL UNIQUE,
    original_url    VARCHAR(2048) NOT NULL,
    custom_alias    VARCHAR(64)  UNIQUE,
    owner_id        UUID         NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP,
    deactivated_at  TIMESTAMP,
    encrypted_original_url VARCHAR(64)
);

CREATE INDEX idx_short_code ON short_urls (short_code);
CREATE UNIQUE INDEX idx_custom_alias ON short_urls (custom_alias) WHERE custom_alias IS NOT NULL;
CREATE INDEX idx_owner_id ON short_urls (owner_id);
CREATE INDEX idx_active_expires ON short_urls (active, expires_at);

CREATE TABLE click_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code      VARCHAR(12)  NOT NULL,
    event_id        VARCHAR(64)  NOT NULL UNIQUE,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(512),
    referrer        VARCHAR(2048),
    country         VARCHAR(2),
    city            VARCHAR(128),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_click_short_code ON click_events (short_code);
CREATE INDEX idx_click_created_at ON click_events (created_at);
