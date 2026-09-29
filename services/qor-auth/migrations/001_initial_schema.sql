-- Qor Auth Initial Schema
-- Database: PostgreSQL 18
-- Created: 2026-01-12

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'system');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE attestation_type AS ENUM ('age_verification', 'region_verification', 'kyc_complete', 'reputation_threshold');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(20) NOT NULL,
    discriminator SMALLINT NOT NULL CHECK (discriminator >= 1 AND discriminator <= 9999),
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url VARCHAR(512),
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',
    on_chain_address VARCHAR(64),
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Composite unique constraint for username#discriminator
    CONSTRAINT unique_qor_id UNIQUE (username, discriminator)
);

-- Index for email lookups (case-insensitive)
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));

-- Index for Qor ID lookups
CREATE INDEX idx_users_qor_id ON users (LOWER(username), discriminator);

-- Index for on-chain address lookups
CREATE INDEX idx_users_on_chain ON users (on_chain_address) WHERE on_chain_address IS NOT NULL;

-- ZK Attestations table
CREATE TABLE attestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attestation_type attestation_type NOT NULL,
    proof_hash BYTEA NOT NULL,
    public_inputs JSONB,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One attestation per type per user (can be updated)
    CONSTRAINT unique_user_attestation UNIQUE (user_id, attestation_type)
);

-- Index for attestation lookups
CREATE INDEX idx_attestations_user ON attestations (user_id);
CREATE INDEX idx_attestations_type ON attestations (attestation_type);

-- Email verification tokens
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_email_verifications_token ON email_verifications (token);
CREATE INDEX idx_email_verifications_expires ON email_verifications (expires_at);

-- Password reset tokens
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_password_resets_token ON password_resets (token);
CREATE INDEX idx_password_resets_expires ON password_resets (expires_at);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit lookups
CREATE INDEX idx_audit_log_user ON audit_log (user_id);
CREATE INDEX idx_audit_log_action ON audit_log (action);
CREATE INDEX idx_audit_log_created ON audit_log (created_at);

-- Linked wallets (multiple on-chain addresses per user)
CREATE TABLE linked_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(50),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for wallet lookups
CREATE INDEX idx_linked_wallets_user ON linked_wallets (user_id);
CREATE INDEX idx_linked_wallets_address ON linked_wallets (address);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to find next available discriminator
CREATE OR REPLACE FUNCTION find_next_discriminator(p_username VARCHAR)
RETURNS SMALLINT AS $$
DECLARE
    next_disc SMALLINT;
BEGIN
    SELECT MIN(d.disc) INTO next_disc
    FROM generate_series(1, 9999) AS d(disc)
    WHERE d.disc NOT IN (
        SELECT discriminator 
        FROM users 
        WHERE LOWER(username) = LOWER(p_username)
    );
    
    RETURN next_disc;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE users IS 'Qor ID user accounts';
COMMENT ON TABLE attestations IS 'ZK-proof attestations for identity verification';
COMMENT ON TABLE audit_log IS 'Immutable audit trail for security events';
COMMENT ON COLUMN users.discriminator IS 'Battle.Net style discriminator (0001-9999)';
COMMENT ON COLUMN users.on_chain_address IS 'Primary linked Substrate account address';
