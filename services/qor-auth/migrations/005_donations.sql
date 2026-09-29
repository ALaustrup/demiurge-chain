-- Demiurge Donation System Schema
-- Database: PostgreSQL 18
-- Created: 2026-01-27

-- Custom types for donations
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_status AS ENUM ('none', 'active', 'past_due', 'cancelled', 'paused');

-- Donations table - tracks individual donation transactions
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent VARCHAR(255),
    status donation_status NOT NULL DEFAULT 'pending',
    tier_at_time INTEGER NOT NULL CHECK (tier_at_time >= 1 AND tier_at_time <= 5),
    is_subscription_payment BOOLEAN NOT NULL DEFAULT FALSE,
    badge_nft_id VARCHAR(255),
    cgt_distributed INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for donations
CREATE INDEX idx_donations_user ON donations (user_id);
CREATE INDEX idx_donations_status ON donations (status);
CREATE INDEX idx_donations_stripe_session ON donations (stripe_session_id);
CREATE INDEX idx_donations_created ON donations (created_at);

-- Donor profiles - lifetime tracking and current tier status
CREATE TABLE donor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- One-time donation tracking
    lifetime_cents INTEGER NOT NULL DEFAULT 0,
    current_tier INTEGER NOT NULL DEFAULT 0 CHECK (current_tier >= 0 AND current_tier <= 5),
    
    -- Badge NFT info
    badge_nft_uuid VARCHAR(255),
    badge_minted_at TIMESTAMPTZ,
    
    -- Accumulated rewards from one-time donations
    total_cgt_received INTEGER NOT NULL DEFAULT 0,
    
    -- Subscription tracking (separate from one-time)
    subscription_tier INTEGER NOT NULL DEFAULT 0 CHECK (subscription_tier >= 0 AND subscription_tier <= 5),
    subscription_status subscription_status NOT NULL DEFAULT 'none',
    subscription_stripe_id VARCHAR(255),
    subscription_started_at TIMESTAMPTZ,
    subscription_current_period_end TIMESTAMPTZ,
    subscription_cgt_received INTEGER NOT NULL DEFAULT 0,
    
    -- Dynamic perks (highest of donation tier or subscription tier + 1)
    free_mints_remaining INTEGER NOT NULL DEFAULT 0,
    staking_bonus_bps INTEGER NOT NULL DEFAULT 0,
    xp_rate_bonus_bps INTEGER NOT NULL DEFAULT 0,
    gas_discount_bps INTEGER NOT NULL DEFAULT 0,
    chat_privileges TEXT[] NOT NULL DEFAULT '{}',
    
    -- Computed effective tier (MAX of current_tier, subscription_tier + 1)
    -- Note: Postgres doesn't support computed columns directly, use trigger
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscription lookups
CREATE INDEX idx_donor_profiles_subscription ON donor_profiles (subscription_stripe_id) 
    WHERE subscription_stripe_id IS NOT NULL;
CREATE INDEX idx_donor_profiles_tier ON donor_profiles (current_tier);

-- Subscription events - history of subscription lifecycle
CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL, -- created, renewed, cancelled, payment_failed, upgraded, downgraded, paused, resumed
    subscription_tier INTEGER,
    stripe_event_id VARCHAR(255) UNIQUE,
    stripe_invoice_id VARCHAR(255),
    amount_cents INTEGER,
    cgt_distributed INTEGER DEFAULT 0,
    free_mints_granted INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscription events
CREATE INDEX idx_subscription_events_user ON subscription_events (user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events (event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events (created_at);

-- Trigger to update updated_at on donor_profiles
CREATE TRIGGER update_donor_profiles_updated_at
    BEFORE UPDATE ON donor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on donations
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate effective tier (highest of donation tier or subscription tier + 1)
CREATE OR REPLACE FUNCTION get_effective_tier(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_donation_tier INTEGER;
    v_subscription_tier INTEGER;
    v_subscription_status subscription_status;
BEGIN
    SELECT current_tier, subscription_tier, subscription_status
    INTO v_donation_tier, v_subscription_tier, v_subscription_status
    FROM donor_profiles
    WHERE user_id = p_user_id;
    
    IF v_donation_tier IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Subscription tier + 1 only counts if subscription is active
    IF v_subscription_status = 'active' THEN
        RETURN GREATEST(v_donation_tier, LEAST(v_subscription_tier + 1, 5));
    ELSE
        RETURN v_donation_tier;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update perks based on effective tier
CREATE OR REPLACE FUNCTION update_donor_perks()
RETURNS TRIGGER AS $$
DECLARE
    v_effective_tier INTEGER;
    v_staking_bonus INTEGER;
    v_xp_bonus INTEGER;
    v_gas_discount INTEGER;
    v_chat_privs TEXT[];
BEGIN
    -- Calculate effective tier
    IF NEW.subscription_status = 'active' THEN
        v_effective_tier := GREATEST(NEW.current_tier, LEAST(NEW.subscription_tier + 1, 5));
    ELSE
        v_effective_tier := NEW.current_tier;
    END IF;
    
    -- Set perks based on effective tier
    CASE v_effective_tier
        WHEN 1 THEN
            v_staking_bonus := 200;
            v_xp_bonus := 500;
            v_gas_discount := 0;
            v_chat_privs := ARRAY['colored_name'];
        WHEN 2 THEN
            v_staking_bonus := 400;
            v_xp_bonus := 1000;
            v_gas_discount := 0;
            v_chat_privs := ARRAY['colored_name', 'animated_name'];
        WHEN 3 THEN
            v_staking_bonus := 600;
            v_xp_bonus := 1500;
            v_gas_discount := 1000;
            v_chat_privs := ARRAY['colored_name', 'animated_name', 'custom_emotes'];
        WHEN 4 THEN
            v_staking_bonus := 800;
            v_xp_bonus := 2000;
            v_gas_discount := 1000;
            v_chat_privs := ARRAY['colored_name', 'animated_name', 'custom_emotes', 'badge_flair'];
        WHEN 5 THEN
            v_staking_bonus := 1000;
            v_xp_bonus := 2500;
            v_gas_discount := 1000;
            v_chat_privs := ARRAY['all'];
        ELSE
            v_staking_bonus := 0;
            v_xp_bonus := 0;
            v_gas_discount := 0;
            v_chat_privs := ARRAY[]::TEXT[];
    END CASE;
    
    NEW.staking_bonus_bps := v_staking_bonus;
    NEW.xp_rate_bonus_bps := v_xp_bonus;
    NEW.gas_discount_bps := v_gas_discount;
    NEW.chat_privileges := v_chat_privs;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update perks when tier changes
CREATE TRIGGER trigger_update_donor_perks
    BEFORE INSERT OR UPDATE OF current_tier, subscription_tier, subscription_status
    ON donor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_donor_perks();

-- Comments
COMMENT ON TABLE donations IS 'Individual donation transactions (one-time and subscription payments)';
COMMENT ON TABLE donor_profiles IS 'Lifetime donor status, tier, and active perks';
COMMENT ON TABLE subscription_events IS 'Subscription lifecycle events for audit trail';
COMMENT ON COLUMN donor_profiles.staking_bonus_bps IS 'Basis points bonus for staking rewards (200 = 2%)';
COMMENT ON COLUMN donor_profiles.xp_rate_bonus_bps IS 'Basis points bonus for XP gain (500 = 5%)';
COMMENT ON COLUMN donor_profiles.gas_discount_bps IS 'Basis points discount on gas fees (1000 = 10%)';
