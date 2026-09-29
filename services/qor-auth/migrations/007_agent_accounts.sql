-- Migration: Add agent account support
-- Agents are AI-powered accounts that can transact autonomously

-- Add account type to distinguish humans from agents
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) 
    DEFAULT 'human' 
    CHECK (account_type IN ('human', 'agent'));

-- Add controller reference (which human owns this agent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS controller_id UUID REFERENCES users(id);

-- Add agent-specific DID (did:demiurge:agent:...)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_did VARCHAR(256);

-- Add agent capabilities (JSON array of allowed actions)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_capabilities JSONB DEFAULT '[]'::jsonb;

-- Add agent autonomy level
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_autonomy VARCHAR(20) 
    CHECK (agent_autonomy IS NULL OR agent_autonomy IN ('supervised', 'bounded', 'autonomous', 'sovereign'));

-- Add spending limit for bounded agents (in CGT units)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_spending_limit BIGINT;

-- Add agent model identifier (for tracking which AI model powers the agent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_model VARCHAR(128);

-- Indexes for agent lookups
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_controller ON users(controller_id) WHERE controller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_agent_did ON users(agent_did) WHERE agent_did IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.account_type IS 'Account type: human or agent';
COMMENT ON COLUMN users.controller_id IS 'For agents: the human user that owns/controls this agent';
COMMENT ON COLUMN users.agent_did IS 'Agent-specific DID in format did:demiurge:agent:network:id';
COMMENT ON COLUMN users.agent_capabilities IS 'JSON array of agent capabilities: read, analyze, trade, transfer, bounty, etc.';
COMMENT ON COLUMN users.agent_autonomy IS 'Autonomy level: supervised, bounded, autonomous, sovereign';
COMMENT ON COLUMN users.agent_spending_limit IS 'Maximum CGT spending limit per epoch (for bounded agents)';
COMMENT ON COLUMN users.agent_model IS 'AI model identifier powering this agent (e.g., gemini-2.0, gpt-4, claude-3)';
