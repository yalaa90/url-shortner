INSERT INTO app_users (subject_id, email, display_name, email_verified, enabled)
VALUES ('11111111-1111-4111-8111-111111111111', 'demo@example.com', 'Demo User', TRUE, TRUE)
ON CONFLICT (subject_id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM app_users WHERE subject_id = '11111111-1111-4111-8111-111111111111'
ON CONFLICT (user_id, role) DO NOTHING;