-- 012: Correct email_verified, which registration wrote inverted.
--
-- POST /api/v1/auth/register stored email_verified = TRUE for an account that
-- gave an email address, and FALSE for one that did not, while telling each the
-- opposite. Every supplied address was marked verified without anyone proving
-- they receive mail at it.
--
-- What the column means, as every insert path now writes it: FALSE while an
-- email address on the account is unverified; TRUE once it has been verified, or
-- when the account has no email address to verify. Keypair and agent accounts
-- are created with no email and TRUE.
--
-- For an account with an email, only verify-email sets the column TRUE, and it
-- clears email_verification_token in the same statement. A row with an email,
-- email_verified = TRUE and a verification token still outstanding was therefore
-- never verified. A row with the token cleared was, and is left alone.

UPDATE users
SET email_verified = FALSE,
    updated_at = NOW()
WHERE email IS NOT NULL
  AND email_verified = TRUE
  AND email_verification_token IS NOT NULL;

-- Registration also wrote FALSE for accounts with no email address.
UPDATE users
SET email_verified = TRUE,
    updated_at = NOW()
WHERE email IS NULL
  AND email_verified = FALSE;

-- The defect can no longer be written: an email address cannot be marked
-- verified while its verification token is outstanding.
ALTER TABLE users
    ADD CONSTRAINT users_email_not_verified_while_token_pending
    CHECK (NOT (email IS NOT NULL AND email_verified AND email_verification_token IS NOT NULL));
