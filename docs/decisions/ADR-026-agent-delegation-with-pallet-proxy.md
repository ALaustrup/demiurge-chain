# ADR-026: Agent delegation through `pallet-proxy`, with custom spend caps

**Status:** Accepted, 15 September 2026, by the project owner, who took option A.
**Resolves:** migration inventory question Q-9 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §3.4, F-Q3).
**Follows:** [ADR-010](ADR-010-agent-rails.md), as amended by [ADR-014](ADR-014-agent-keys-authorised-not-created.md).

## Context

ADR-010 wants agents to act for a user under scoped, revocable authorisations, with spend caps enforced by the protocol.
ADR-014 made QOR ID authorise agent keys rather than create them, and moved enforcement on chain.

The custom chain's session-keys module stores an expiry and nothing else, and nothing consults it (inventory §3.4).

The inventory's options:
- **A.** `pallet-proxy`, with Demiurge proxy types as the call filter, plus a custom spend-cap pallet.
- **B.** A custom delegation pallet.

## Decision

**Option A.**
- **The controller adds the agent as a proxy** of its account, with a Demiurge proxy type. The type decides which calls
  the agent may make.
- **`pallet-agent-caps` enforces spend caps** (name under ADR-032).
- **Revocation** is `remove_proxy`, effective from the next block.

What the controller signs on chain is the agent authorisation (inventory F-Q2: never "session keys").

## Recorded, as the owner asked

Checked at `polkadot-stable2606-1` on 15 September 2026:
1. **Proxy types are a runtime enum.** Strictly, `ProxyType` is a configuration type the runtime supplies,
   implementing `InstanceFilter` over the runtime's calls. It is normally an enum, and Demiurge's is one
   (`substrate/frame/proxy/src/lib.rs:148-158`). Either way it is compiled into the runtime, so **a new scope needs a
   runtime upgrade.** The type's default must be the most permissive one, so the default type is never granted to an
   agent.
2. **Spend caps are custom under either option.** `pallet-proxy` filters calls and has no spending limit (inventory
   F-Q3).
3. **A delegate pays its own fees.** The fee for a `proxy` call is taken from the account that signs it, which is the
   agent. The inner call then runs as the real account, which pays anything the call itself moves
   (`substrate/frame/transaction-payment/src/lib.rs:1005-1021`, `proxy/src/lib.rs:248-256, 994-1001`).
   - **So an agent account must exist and pay fees,** and that **interacts with Q-12**: an agent needs an existential
     deposit and fees, from its controller or a sponsor (ADR-029).
4. **Adding a proxy reserves a deposit from the controller's account:** a base, plus a factor per proxy
   (`proxy/src/lib.rs:853-872, 927`). A controller that holds only a sponsored existential deposit cannot reserve it.
   Sponsorship has to cover it, or agent rails need funded controllers (`docs/architecture/SPONSORSHIP.md`).

## Alternatives rejected

- **B. A custom delegation pallet.** It rebuilds revocation, call filtering, announcement delays and deposits, which are
  key-custody concerns ADR-001 keeps boring. It would still need custom spend caps.

## Consequences

- **The spend-cap design is M5.2 work.** A proxy type's filter sees the call but cannot record what was spent (Inferred
  from `InstanceFilter::filter` taking only the call), so caps need a pallet that records spending. How agents' calls
  pass through it is designed there.
- **ADR-014's known gap closes on chain.** The controller's own key signs `add_proxy`, so an access token alone can no
  longer authorise an agent (launcher L5.1).
- **QOR ID's agent records become advisory.** The authorisation that counts is on chain. QOR ID keeps the metadata:
  controller, label and capabilities as displayed.
- **Agent keys are Sr25519** (ADR-023).
