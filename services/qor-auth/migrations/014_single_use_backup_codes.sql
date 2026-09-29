-- 014: Backup codes are stored hashed, an account holds several, and each works once.
--
-- An account without an email address had one backup code, stored in plain text
-- in users.backup_code and compared as given. Nothing marked it used, so it reset
-- the password any number of times, and anyone who read the table read the codes.
--
-- Each code now has a row holding only its hash: SHA-256, as hex, of the code in
-- upper case with spaces and hyphens removed. A code carries 160 bits of
-- randomness, so a fast hash is enough. `used_at` is set in the same transaction
-- that resets the password, and a code with `used_at` set is refused.

CREATE TABLE backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash CHAR(64) NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT backup_codes_unique_per_user UNIQUE (user_id, code_hash)
);

CREATE INDEX idx_backup_codes_unused ON backup_codes (user_id) WHERE used_at IS NULL;

-- Each existing code becomes that account's one remaining code, hashed the same way.
INSERT INTO backup_codes (user_id, code_hash)
SELECT id, encode(sha256(convert_to(upper(regexp_replace(backup_code, '[[:space:]-]', '', 'g')), 'UTF8')), 'hex')
FROM users
WHERE backup_code IS NOT NULL;

DROP INDEX IF EXISTS idx_users_backup_code;
ALTER TABLE users DROP COLUMN backup_code;
