# ADR-021: Governance by a collective now; a hybrid with OpenGov before mainnet

**Status:** Accepted, 15 September 2026, by the project owner. **Where voting power comes from (U-10) is not decided
here** and must not be assumed.
**Resolves:** migration inventory question Q-4 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §3.3).
**Follows:** [ADR-002](ADR-002-value-from-spending.md) (the spend test) and [ADR-013](ADR-013-polkadot-sdk-migration.md).

## Context

The custom governance module is unreferenced. Its stake is a number the caller supplies, voting power is computed in
`f64`, and execution only encodes bytes (inventory §3.3; Verified repo). None of it is carried.

The Polkadot SDK offers:
- **OpenGov:** `pallet-referenda`, `pallet-conviction-voting`, `pallet-ranked-collective`, `pallet-whitelist`,
  `pallet-scheduler` and `pallet-preimage`.
- **A collective:** `pallet-collective` with `pallet-membership`.

All are present at the pinned release (ADR-022).

## Decision

**Governance is collective-based now, and a hybrid with OpenGov later.**
- **Now:** a council, `pallet-collective`, whose members are managed by `pallet-membership`. Every member has one vote.
  Nothing about its voting depends on holding CGT.
- **Sudo on development and test networks only,** with the removal path below. The mainnet runtime never includes
  `pallet-sudo`.
- **Later:** full OpenGov before mainnet, in a hybrid where a collective keeps a defined role. This is a Public Release
  criterion in `docs/GATES.toml`.
- **U-10 is decided before OpenGov lands.** It is written up in `docs/economics/OPEN_QUESTIONS.md` with options and a
  recommendation. OpenGov's standard voting weights votes by locked CGT, which is exactly what U-10 has to settle.

## How the collective acts, at the pinned release

- **A passed motion is not Root.** It dispatches with the collective's own `Members` origin
  (`substrate/frame/collective/src/lib.rs`).
- **Ordinary privileged calls** name a collective proportion as their origin, such as
  `EnsureProportionAtLeast<AccountId, Council, N, D>`. Treasury spends, validator changes (ADR-020) and parameters
  work this way.
- **Calls that need Root,** such as a runtime upgrade, go through `pallet-whitelist`. The collective whitelists a call's
  hash, then dispatches the whitelisted call, which runs as Root. Its preimage must be available.
- **Membership** changes through `pallet-membership` with a collective proportion as its origin.
- **The proportions are proposed at M3,** in the runtime work, and approved by the owner. They are governance
  configuration, not economic values. As a proposal: runtime upgrades and anything run as Root need at least three
  quarters of members, and ordinary changes need more than half.
- **The first members** are named in genesis by the owner.

## Removing sudo

On a test network that outlives its sudo phase, and as the rehearsal for mainnet:
1. **The governance origins above are live and tested on that network,** including a runtime upgrade through
   `pallet-whitelist`.
2. **The sudo key calls `sudo.remove_key`,** which removes the key permanently (`substrate/frame/sudo/src/lib.rs`).
3. **A runtime upgrade removes `pallet-sudo`** from the runtime, and clears its storage with
   `frame_support::migrations::RemovePallet`. Its storage is one value, well within a block's weight. The migration
   has no guard rails for pallets whose storage would not be.

The mainnet chain specification never includes sudo, so mainnet never needs this path.

## Alternatives rejected

- **OpenGov now.** Its voting power question (U-10) is open. Before CGT is distributed, token-weighted referenda would
  be decided by the owner's own tokens.
- **Sudo on every network.** One key would control a chain meant to carry value.

## Consequences

- **Collective members are named accounts,** and their votes are public on chain.
- **Collective governance is centralised by design.** That is accepted for the stages before mainnet, and ended by the
  OpenGov criterion.
- **The treasury** (`pallet-treasury`, inventory §3.1) spends only by collective proportion.
- **Roadmap M3.1** includes sudo on development and test networks, per this record.
