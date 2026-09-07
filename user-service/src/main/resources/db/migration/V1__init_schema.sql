CREATE TABLE app_users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id           VARCHAR(128) NOT NULL UNIQUE,
    email                VARCHAR(320) NOT NULL UNIQUE,
    display_name         VARCHAR(128),
    phone                VARCHAR(20),
    email_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    profile_picture_url  VARCHAR(2048)
);

CREATE TABLE user_roles (
    user_id  UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role     VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_role ON user_roles (role);