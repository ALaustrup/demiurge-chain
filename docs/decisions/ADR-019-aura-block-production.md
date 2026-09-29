# ADR-019: Blocks are produced by Aura

**Status:** Accepted, 15 September 2026, by the project owner.
**Resolves:** migration inventory question Q-2 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §4.1).
**Follows:** [ADR-018](ADR-018-standalone-chain-grandpa-finality.md) (a standalone chain with GRANDPA finality) and
[ADR-020](ADR-020-permissioned-validators-now-npos-later.md) (a permissioned validator set).

## Context

The custom chain produces blocks on a hand-written slot schedule, with a stake-weighted proposer and no finality
(inventory §4.1). The Polkadot SDK has two standard block-production engines:
- **Aura:** the authorities take slots in a fixed round-robin order.
- **BABE:** slot leaders are chosen by a verifiable random function, so the next author is not known in advance, with
  secondary slots so that none goes empty.

## Decision

**Aura.** BABE's randomised slots protect an open, stake-weighted validator set against an attacker who would target
the next author, and they need epochs and on-chain randomness to do it. Demiurge's validator set is permissioned and
chosen by governance (ADR-020). **BABE's randomised slots solve a problem Demiurge does not have.** Finality is GRANDPA
either way (ADR-018).

## Alternatives rejected

- **BABE.** It adds epochs, VRF keys, randomness and secondary-slot configuration to operate and to get right, for a
  protection a permissioned set does not need.

## Consequences

- **Each validator holds two consensus keys,** an Aura key and a GRANDPA key, set through `pallet-session` (ADR-020).
  At the pinned release both pallets follow session changes: Aura changes its authorities and GRANDPA schedules a set
  change (`substrate/frame/aura/src/lib.rs`, `substrate/frame/grandpa/src/lib.rs`).
- **The next author is predictable.** In a small set, a targeted denial of service can make an author miss its slot.
  Blocks continue at the next slot, and finality is unaffected. This is accepted for the permissioned phase.
- **Revisited with the move to nominated proof of stake** (ADR-020). An open set is exactly what BABE was built for, so
  that migration re-examines this choice.
- **Aura carries to a parachain.** The parachain template at the pinned release uses Aura with `cumulus-pallet-aura-ext`,
  so this choice does not work against ADR-018's condition.
