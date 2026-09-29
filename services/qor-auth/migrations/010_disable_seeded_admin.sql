-- Disable the administrator seeded by the original migration 008.
--
-- Where the original 008 ran, that account's recovery code and password were
-- public: both were committed to the repository. Found during the M1 audit; see
-- migration 008 and SECURITY.md.
--
-- The account is disabled rather than deleted, so that audit_log rows written
-- under it keep their attribution (audit_log.user_id is ON DELETE SET NULL).
--
--   * Password and keypair login refuse any account whose status is not
--     'active' (src/handlers/auth.rs).
--   * The recovery code is cleared, so the backup-code reset cannot match.
--   * The role no longer grants administrative access.
--   * The password hash is replaced with a value no password can match.
--
-- Tokens already issued under the account stay valid until they expire, and a
-- refresh copies the role from the old token. Rotating the JWT secrets (see
-- SECURITY.md) invalidates them all.
--
-- On a database that never ran the original 008, this changes nothing.

UPDATE users
SET role = 'user',
    status = 'banned',
    backup_code = NULL,
    password_hash = '!disabled: seeded account removed by migration 010',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND username = 'godmode';

COMMENT ON TABLE users IS 'User accounts';
