-- Fix on_chain_address so it can hold a real Demiurge account.
--
-- A Demiurge account ID *is* a 32-byte Ed25519 public key, which is 64 hex
-- characters, and the canonical display form carries an `0x` prefix. That is 66
-- characters. The column was varchar(64), two short.
--
-- Two consequences, both of which this migration and the accompanying handler
-- change address:
--
--   1. Password registration built `0x` + a 64-character SHA-256 hash and tried
--      to store 66 characters in a 64-character column. Postgres rejected it
--      with SQLSTATE 22001 and the whole request failed with a 500. Password
--      registration therefore never worked, on any deployment.
--
--   2. Keypair registration dodged the error by storing `0x` + only the first 40
--      characters of the public key, an Ethereum-style 20-byte truncation. That
--      value is not an account on this chain: it cannot be verified against a
--      signature and it cannot receive CGT. It fit the column, which is the only
--      reason it appeared to work.
--
-- Widening to 66 lets both paths store the full account.

ALTER TABLE users
    ALTER COLUMN on_chain_address TYPE VARCHAR(66);

-- Truncated addresses written by the old keypair path are unusable: there is no
-- way to recover the missing 24 bytes from the stored value. Where the account's
-- public key is still on record, rebuild the address from it. Any row without a
-- public key is cleared rather than left holding a plausible-looking address
-- that can never receive funds.
UPDATE users
SET on_chain_address = '0x' || lower(primary_pubkey)
WHERE primary_pubkey IS NOT NULL
  AND length(primary_pubkey) = 64
  AND (on_chain_address IS NULL OR length(on_chain_address) <> 66);

UPDATE users
SET on_chain_address = NULL
WHERE on_chain_address IS NOT NULL
  AND length(on_chain_address) <> 66;

-- Reject anything that is not `0x` followed by 64 lowercase hex characters, so
-- a malformed address cannot be written again.
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_on_chain_address_format;

ALTER TABLE users
    ADD CONSTRAINT users_on_chain_address_format
    CHECK (on_chain_address IS NULL OR on_chain_address ~ '^0x[0-9a-f]{64}$');

COMMENT ON COLUMN users.on_chain_address IS
    'Demiurge account: 0x followed by the 64-hex-character Ed25519 public key.';
