-- 017: Addresses QOR ID must not send to, reported by Resend's webhooks.
--
-- A reset link sent to an address that bounces permanently failed every time, and nobody saw it:
-- QOR ID heard nothing back from Resend. Resend now reports to POST /api/v1/webhooks/resend,
-- signed. An address that bounces permanently, that Resend has suppressed, or whose owner marked a
-- message as spam is recorded here, and nothing more is sent to it.
--
-- Only a SHA-256 of the trimmed, lower-cased address is kept, so an address that bounced and belongs
-- to no account is not stored in the clear.

CREATE TABLE email_suppressions (
    address_hash CHAR(64) PRIMARY KEY,
    reason VARCHAR(16) NOT NULL CHECK (reason IN ('bounce', 'complaint', 'suppressed')),
    resend_email_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE email_suppressions IS 'Addresses no email is sent to: a permanent bounce, a Resend suppression, or a complaint';
COMMENT ON COLUMN email_suppressions.address_hash IS 'SHA-256, hex, of the trimmed lower-cased address';
COMMENT ON COLUMN email_suppressions.reason IS 'bounce, suppressed or complaint: the first report that marked it';
COMMENT ON COLUMN email_suppressions.resend_email_id IS 'Resend''s id for the message that was reported';

-- Each signed delivery is acted on once. Resend retries a delivery until it is acknowledged, and a
-- captured request stays validly signed for the five minutes its timestamp is accepted.
CREATE TABLE resend_webhook_deliveries (
    svix_id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE resend_webhook_deliveries IS 'Webhook deliveries from Resend already acted on, by svix-id';
