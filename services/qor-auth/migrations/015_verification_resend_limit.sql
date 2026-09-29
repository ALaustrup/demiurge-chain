-- 015: Record when verification messages were sent, so a new one can be issued, and rate-limited.
--
-- An account that registered with an email address while email was not configured
-- was never sent its verification message. Its token lapses after 24 hours, and
-- nothing issued another, so it could never verify and never recover its password
-- by email. POST /api/v1/auth/resend-verification issues a new token, which
-- replaces the old one, and sends it.
--
-- These columns hold the limit: at most one message every 5 minutes, and at most 5
-- in any 24-hour window, per account. Registration that sends a message counts as
-- the first. Accounts that exist before this migration have sent nothing on record.

ALTER TABLE users ADD COLUMN email_verification_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN email_verification_send_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_count_since TIMESTAMPTZ;

COMMENT ON COLUMN users.email_verification_sent_at IS 'When the latest verification message was sent';
COMMENT ON COLUMN users.email_verification_send_count IS 'Verification messages sent since email_verification_count_since';
COMMENT ON COLUMN users.email_verification_count_since IS 'Start of the 24-hour window email_verification_send_count counts';
