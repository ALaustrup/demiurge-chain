-- Migration: Add keypair-based authentication
-- This allows users to authenticate via cryptographic signatures alongside traditional password auth

-- Add primary public key column for keypair auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_pubkey VARCHAR(128);

-- Add auth method tracking (password, keypair, or both)
DO $$ BEGIN
    CREATE TYPE auth_method AS ENUM ('password', 'keypair', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) 
    DEFAULT 'password' 
    CHECK (auth_method IN ('password', 'keypair', 'both'));

-- Create index for fast pubkey lookups
CREATE INDEX IF NOT EXISTS idx_users_pubkey ON users(primary_pubkey) WHERE primary_pubkey IS NOT NULL;

-- Create table for tracking active auth challenges (prevents replay attacks)
CREATE TABLE IF NOT EXISTS auth_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pubkey VARCHAR(128) NOT NULL,
    challenge TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for challenge lookups
CREATE INDEX IF NOT EXISTS idx_auth_challenges_pubkey ON auth_challenges(pubkey);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires ON auth_challenges(expires_at);

-- Cleanup job: Remove expired challenges (run periodically)
-- DELETE FROM auth_challenges WHERE expires_at < NOW() OR used = TRUE;

COMMENT ON COLUMN users.primary_pubkey IS 'Primary Ed25519 public key for keypair-based authentication';
COMMENT ON COLUMN users.auth_method IS 'Authentication method: password, keypair, or both';
COMMENT ON TABLE auth_challenges IS 'Temporary storage for signature challenges to prevent replay attacks';
