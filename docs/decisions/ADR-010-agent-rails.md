# ADR-010: Agent rails: delegated session keys and an MCP server

**Status:** Accepted, 13 September 2026, by the project owner.

## Context

AI agents will act on users' behalf: generating work, minting it, licensing it, running shops. The
earlier approach gave agents their own keys and stored credentials, which means an agent compromise is
an identity compromise, and every LLM vendor needed its own integration. The chain has a session-keys
module, but nothing in a transaction carries a session key and nothing checks one.

## Decision

The first release ships the agent surface, not agent products.

Delegated authentication, not stored credentials: QOR ID mints a scoped, revocable session key for an
agent. The agent never holds the user's identity. Capabilities are enumerable per operation, spend caps
are enforced on the protocol side, and any single agent can be revoked without affecting others.

Demiurge ships an MCP server rather than bespoke plugins per LLM vendor. One implementation makes "any
LLM can navigate the ecosystem" a documentation problem rather than an integration problem.

The reference capability is generate-and-mint: a user's model creates work and mints it as DRC-369 on
chain, within the limits the user set.

Autonomous agents with their own identity and wallet (licensing bots, shops, level testers) come later,
on the same rails.

## Consequences

Session keys have to become real in the transaction format and in execution: a field for the key, a
check of its scope and spend cap during execution, and revocation that takes effect at the next block.
The reconciliation report records what the session-keys module does today and that the runtime does
not consult it.

The MCP server is new code with no precedent in the repository; the `tools/spline-mcp-server`
directory is empty. It calls the same RPC and signing path as the SDK, with a session key rather than a
vault key.

The agentic module in `framework/modules/agentic` and the `agent-foundry` package were built for
agents that hold their own keys. They are not the first release's design and are not carried forward
without being re-based on delegated keys.

Agent compute is one of the demand sinks in ADR-006; its metering is unaddressed (U-9).
