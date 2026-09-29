# ADR-014: QOR ID authorises agent keys; it never creates them

**Status:** Accepted, 14 September 2026, by the project owner.
**Amends:** [ADR-010](ADR-010-agent-rails.md). It settles what "QOR ID mints a scoped, revocable session
key for an agent" means. Everything else in ADR-010 stands.

## Context

ADR-010 says QOR ID mints a scoped, revocable session key for an agent, and that the agent never holds
the user's identity. "Mints" admits two readings. In the first, QOR ID generates the key and hands it
over. In the second, QOR ID authorises a key the agent generated.

The service followed the first reading, in the most dangerous form. Until 14 September 2026,
`POST /api/v1/agents/register` did the following:
- drew 32 random bytes as the agent's private key;
- stored their hex as the agent's public key;
- hashed them into the password column;
- returned them to the caller (`services/qor-auth/src/handlers/agents.rs:98-147` at commit `d1bf005`).

Migration 009 later copied the same value into `on_chain_address` wherever such a row existed. The
options and the exposure are set out in
[`docs/architecture/AGENT_KEY_CUSTODY.md`](../architecture/AGENT_KEY_CUSTODY.md).

## Decision

The second reading. **An agent generates its own keypair. QOR ID authorises the public key and never
generates, stores or returns a private key**, for an agent or for any other account.

- QOR ID records who controls the agent, what it may do, its spend cap, and whether the authorisation has
  been revoked.
- Registration requires proof of possession: the agent's key signs a live, single-use challenge issued for
  that exact public key.
- The controller is taken from the authenticated session, never from the request.
- Only the controller can read, change or revoke its agents.

Containment is the fastest route to zero server-held private keys, accepting a breaking change because
the project is pre-launch:
- registration changes shape now;
- a migration removes every server-generated key already stored, and disables those agents.

## Consequences

**Registration is a breaking change.** Clients must send `pubkey`, `challenge` and `signature`, and the
response no longer contains a secret. The frozen `packages/agent-foundry` client no longer works, and was
not working before (it sent no authorisation header).

**Every agent registered under the old flow is disabled** by migration 011 and must register again with a
key it generated itself.

**Known gap: an access token alone can register an agent.** Until the controller's launcher vault signs
each agent authorisation (option A's second half), authorisation rests on the controller's session.
Anyone holding a controller's access token can register an agent for that controller. The access token is
short-lived, but it is not a signature by the controller's key.

This is a **known gap, not a design choice**, and it must not become permanent:
- It is closed by launcher track L5.1, the vault-signed authorisation.
- L5.1 is a criterion of the Beta gate (`docs/GATES.toml`), so the public testnet cannot open with the gap
  in place.
- It is listed in `HANDOFF.md` among the known gaps.

**Enforcement moves on chain.** Spend caps and capability limits are not protocol-enforced while they
live in `qor-auth`'s database. On the Polkadot SDK chain the authorisation is enforced on chain: through
`pallet-proxy` plus custom spend caps, or a custom pallet (migration inventory Q-9).

**Naming.** Substrate already uses "session keys" for validator keys (inventory F-Q2). Documents call
what QOR ID issues an **agent authorisation**. Module and pallet names still need the owner's approval.
