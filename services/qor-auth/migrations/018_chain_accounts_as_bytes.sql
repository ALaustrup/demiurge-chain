-- 018: One account is 32 bytes, and it arrives only by proving a key.
--
-- Three decisions land here together, because they are one change to what a
-- chain identity is (ADR-017, ADR-023, ADR-024):
--
-- 1. **Bytes, not a string** (ADR-024). `on_chain_address` held `0x` and 64 hex
--    characters. An SS58 address depends on a prefix, the mainnet prefix is not
--    decided, and Postgres has neither base58 nor Blake2b, so an SS58 column
--    could not be backfilled or checked here. Bytes make one account exactly one
--    row, whichever form it arrived in.
--
-- 2. **One column, not two** (ADR-023). For Sr25519 the account ID *is* the
--    public key, so `primary_pubkey` and `on_chain_address` held the same fact
--    in two encodings, and could disagree. Both are replaced by
--    `chain_account_id`.
--
-- 3. **No derived addresses** (ADR-017). Registration derived an address by
--    hashing a name, a discriminator and the clock. No key corresponds to such
--    an address, so anything sent there could never be moved, while every
--    interface showed it as a real account. `hash_to_address` is removed in the
--    same change, so nothing can derive one again.
--
-- **Nothing is backfilled, and that is deliberate.** ADR-024 §1 specified a
-- backfill from the existing column. It cannot carry its meaning across this
-- change: every stored key is an Ed25519 key, and ADR-023 makes accounts
-- Sr25519, so those 32 bytes now name an account nobody holds a secret for.
-- Keeping them would bind each QOR ID to an account it can never prove again,
-- and re-linking is refused by design ("this QOR ID already has a different
-- account linked"), so the account would be stuck. Clearing them lets every
-- account link its Sr25519 key. ADR-023 §3 said these links must be made again;
-- this is that. ADR-039 records the reasoning.
--
-- **What this costs.** A key-only account created before this migration cannot
-- sign in afterwards: its password is a random value nobody knows, and its key
-- no longer verifies. It has to be created again. Nothing is deployed and no
-- network holds value, so this is the cheapest this change will ever be
-- (ADR-023, "Consequences").

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS chain_account_id BYTEA;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_chain_account_id_length;

ALTER TABLE users
    ADD CONSTRAINT users_chain_account_id_length
    CHECK (chain_account_id IS NULL OR octet_length(chain_account_id) = 32);

-- An account belongs to at most one QOR ID. The unique index is what enforces
-- it, rather than the check the handler makes, which races with itself.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_chain_account
    ON users (chain_account_id) WHERE chain_account_id IS NOT NULL;

COMMENT ON COLUMN users.chain_account_id IS
    'The 32 bytes of the account this QOR ID has proven a key for (ADR-017, ADR-023). NULL until it proves one. For Sr25519 the account ID is the public key, so this is both.';

-- The two columns this replaces. Every reader in the repository was changed in
-- the same commit, which is the condition ADR-024 set for dropping
-- `on_chain_address`, and nothing is deployed that could still read either.
ALTER TABLE users DROP COLUMN IF EXISTS on_chain_address;
ALTER TABLE users DROP COLUMN IF EXISTS primary_pubkey;

-- ---------------------------------------------------------------------------
-- auth_challenges
-- ---------------------------------------------------------------------------

-- A challenge is issued for an account and answered by it, so it is keyed the
-- same way. Existing rows are dropped rather than converted: a challenge lives
-- five minutes, and one issued for an Ed25519 key can no longer be answered.
DELETE FROM auth_challenges;

ALTER TABLE auth_challenges ADD COLUMN IF NOT EXISTS chain_account_id BYTEA;

ALTER TABLE auth_challenges
    DROP CONSTRAINT IF EXISTS auth_challenges_chain_account_id_length;

ALTER TABLE auth_challenges
    ADD CONSTRAINT auth_challenges_chain_account_id_length
    CHECK (chain_account_id IS NULL OR octet_length(chain_account_id) = 32);

DROP INDEX IF EXISTS idx_auth_challenges_pubkey;
ALTER TABLE auth_challenges DROP COLUMN IF EXISTS pubkey;

ALTER TABLE auth_challenges ALTER COLUMN chain_account_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auth_challenges_account
    ON auth_challenges (chain_account_id);

COMMENT ON COLUMN auth_challenges.chain_account_id IS
    'The account the challenge was issued for, and the only one whose signature can answer it';
