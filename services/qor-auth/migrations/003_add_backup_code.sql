-- Add backup_code field for username-only users
-- This allows password reset without email

ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_code VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- Index for backup code lookups (for password reset)
CREATE INDEX IF NOT EXISTS idx_users_backup_code ON users (backup_code) WHERE backup_code IS NOT NULL;

-- Make email nullable for username-only accounts
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Update unique constraint to allow NULL emails
DROP INDEX IF EXISTS idx_users_email_lower;
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email)) WHERE email IS NOT NULL;

COMMENT ON COLUMN users.backup_code IS 'Backup code for password reset (username-only accounts)';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.email_verification_expires_at IS 'Expiration time for email verification token';
