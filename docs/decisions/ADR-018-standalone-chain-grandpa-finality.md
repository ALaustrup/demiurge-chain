# ADR-018: A standalone chain, with its own validators and GRANDPA finality

**Status:** Accepted, 15 September 2026, by the project owner.
**Resolves:** migration inventory question Q-1 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §8).
**Follows:** [ADR-013](ADR-013-polkadot-sdk-migration.md) (standard components in the stay-boring layer).

## Context

ADR-013 moved the base layer to the Polkadot SDK and left open whether "L1" means a standalone chain or a
parachain. The inventory read the owner's "purpose-built Substrate L1" as standalone, and marked that reading as
inferred.
- **A standalone chain** runs its own validators and its own finality.
- **A parachain** takes its security from the Polkadot relay chain and pays for block space with coretime.

## Decision

**Demiurge is a standalone chain.** It has its own validators (ADR-020) and its own finality, **GRANDPA**. Blocks are
produced by Aura (ADR-019).

**One condition: the runtime is written so that a later move to a parachain does not require rewriting it.** Checked
against the solochain and parachain templates at the pinned release (`polkadot-stable2606-1`, ADR-022), that means:
- **Validator identity is the account.** `pallet-session` runs with `ValidatorId = AccountId`, and its session manager
  keeps the same storage and calls as `pallet-collator-selection`'s invulnerables (ADR-020). A parachain swaps one for
  the other in configuration.
- **Privileged origins are `EnsureOrigin` types,** so they can later be widened, for example to accept a relay-chain
  origin, without touching the pallets that use them.
- **No runtime logic depends on GRANDPA state, on one block per slot, or on a fixed slot time.** Aura and timestamp
  settings stay behind configuration types.
- **Storage writes per block are bounded** and storage proofs stay small, because a parachain block must fit the relay
  chain's proof-size limit.
- **Pallet indices** leave room for the pallets a parachain adds, or the move accepts a storage migration.

What a move would still change, all of it configuration and migration rather than a rewrite:
- **Pallets added:** parachain-system, parachain-info, Aura extension, collator selection, the XCM pallets and the
  message queues.
- **Removed:** `pallet-grandpa` and its session key.
- **Also changed:** the upgrade hook, weight reclaim and the node.

Two parts could not be verified at the release. There is no ready migration for the session-key change, and no
guide to converting a live standalone chain's state. Both are costs the move would carry.

## What a standalone chain's security is

**A standalone chain is as secure as the stake actually committed to it.** Until CGT is distributed, that is near
zero: nobody but the project holds CGT.
- **In the permissioned phase (ADR-020),** safety does not come from stake at all. It rests on the honesty of the
  validator operators governance names, and on the governance that names them.
- **After the move to nominated proof of stake (ADR-020),** it rests on the stake actually bonded, which stays small
  until CGT is widely held.
- **A parachain** would instead share the relay chain's security, paid for with coretime.

This is why the choice is revisited before mainnet.

## Alternatives rejected

- **A parachain now.**
  - It adds coretime, the relay chain as a dependency, and cross-chain messaging before the first release needs any
    of them.
  - The move remains open, and the condition above keeps it affordable.

## Consequences

- **The validators are the project's own for the stages before mainnet,** hosted under ADR-015.
- **`docs/GATES.toml` adds a Public Release criterion.** Whether Demiurge stays standalone or becomes a parachain is
  revisited before mainnet, against the stake then actually committed, and recorded in an ADR.
- **Replay across networks** is closed by `CheckGenesis` (D-009), whichever form the chain takes.
- **The inventory's standalone reading** of Q-1 is confirmed by this decision.
- **Address prefixes** interact with a later move: the ecosystem recommends prefix 0 for chains connected to Polkadot
  (ADR-024).
