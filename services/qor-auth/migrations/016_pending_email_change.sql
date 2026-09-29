-- 016: An added or changed email address is held as pending until it is verified.
--
-- An account without an email address can recover a forgotten password only with
-- a backup code, so once its codes are gone it has no recovery at all. POST
-- /api/v1/profile/email lets a signed-in account, confirming its password, add an
-- address or change the current one.
--
-- The new address waits here until the link sent to it is followed. Until then the
-- account is unchanged: `email` and `email_verified` keep their current values, so
-- an address nobody has confirmed is never used for sign-in or recovery. A newer
-- request replaces the pending one, and a password reset clears it.

ALTER TABLE users ADD COLUMN pending_email VARCHAR(255);
ALTER TABLE users ADD COLUMN pending_email_token VARCHAR(64);
ALTER TABLE users ADD COLUMN pending_email_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_users_pending_email_token ON users (pending_email_token)
    WHERE pending_email_token IS NOT NULL;

COMMENT ON COLUMN users.pending_email IS 'An added or changed address, not yet verified';
COMMENT ON COLUMN users.pending_email_token IS 'Token that confirms pending_email';
COMMENT ON COLUMN users.pending_email_expires_at IS 'When pending_email_token stops working';
