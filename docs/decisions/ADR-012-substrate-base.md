# ADR-012: A purpose-built Substrate L1 as the base

**Status:** Accepted as direction, 13 September 2026, by the project owner. **Not reflected in the
code**, which is a custom chain that does not depend on Substrate. The path from one to the other is
unresolved (U-5 in `docs/economics/OPEN_QUESTIONS.md`) and is the first item in
`docs/audit/RECONCILIATION.md`.
**Contradicts:** D-007 (custom slot-scheduled block production, with BFT finality to follow) in
`docs/DECISIONS.md`, and the M1 work that implemented it.
**Superseded by:** [ADR-013](ADR-013-polkadot-sdk-migration.md), 14 September 2026. The owner chose the
first reading: migrate onto the Polkadot SDK.

## Context

The direction of 13 September 2026 states that Demiurge is a creative engine built on a purpose-built
Substrate L1, and ADR-001 places consensus, custody, storage and upgrade paths in the category where
proven Substrate components are used because failure there is silent and permanent.

The chain in `framework/` is not Substrate. Its workspace declares no `sp-*`, `frame-*` or `sc-*`
dependency (`framework/Cargo.toml`); its core crate announces the fact in its first comment
(`framework/core/src/lib.rs:3`); consensus is a custom slot schedule with a custom seal and no finality
(`framework/consensus/src/engine.rs`, `framework/node/src/chain.rs`); storage is RocksDB with a custom
Merkle root (`framework/storage/src/root.rs`). The only Substrate code in the repository is two dead
pallets under `aeons/` that no workspace builds. What the chain shares with Substrate is the SCALE
codec and a few Substrate-style RPC aliases.

## Decision

The base of Demiurge is a purpose-built Substrate L1, using proven Substrate components for the
"stay boring" layer: consensus and finality, key custody conventions, storage, genesis and issuance
mechanics, and runtime upgrades.

This record deliberately does not decide how the current chain becomes that. Two readings are
possible: a migration of the runtime modules onto the Substrate SDK, keeping DRC-369, energy, session
keys and the QOR ID modules as pallets; or an adoption of specific Substrate components inside the
custom node. They differ in what they keep, what they discard and what they cost, and choosing between
them is the owner's decision, to be made with the reconciliation report in hand.

## Consequences

Until the path is chosen, the base layer is in limbo: further custom consensus work (finality, fork
choice) would be discarded under the first reading, and Substrate adoption cannot start under either
without a decision. The reconciliation report lists the subsystems each reading touches, with the
files and formats that would change.

Everything above the base layer is unaffected by which reading is chosen, provided it is written
against module interfaces rather than against the custom node's internals. That is an argument for
doing the asset-primitive work of ADR-009 in a way that does not deepen the dependency on the custom
consensus.

Documentation must not describe the current chain as Substrate. Until this record is reflected in the
code, `docs/protocol/PROTOCOL.md` describes what runs, and this record describes where it is going.
