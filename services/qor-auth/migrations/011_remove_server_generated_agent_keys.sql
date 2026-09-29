-- Remove every agent key the server generated (ADR-014).
--
-- Until 14 September 2026, POST /api/v1/agents/register generated an agent's
-- private key on the server, stored its hex in primary_pubkey, hashed it into
-- password_hash and returned it to the caller. Migration 009 later copied the
-- same value into on_chain_address. QOR ID must never hold a private key, so
-- every agent registered that way loses its key material and is disabled. Those
-- agents must register again with a key they generated themselves.
--
-- Found during the M1 audit; see docs/architecture/AGENT_KEY_CUSTODY.md. The
-- version of the service that ships this migration accepts only agent-generated
-- keys, and migrations run before the service accepts requests, so every agent
-- row present when this runs was created by the old flow.

UPDATE users
SET primary_pubkey = NULL,
    on_chain_address = NULL,
    password_hash = '!disabled: server-generated agent key removed by migration 011',
    status = 'inactive',
    updated_at = NOW()
WHERE account_type = 'agent';
