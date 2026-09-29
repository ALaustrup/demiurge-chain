# ADR-032: Where the new chain lives, and its crate and pallet names

**Status:** Accepted, 15 September 2026, by the project owner. The names first conflicted with the naming convention
in `.cursorrules`. The owner took option 1 below, and `.cursorrules` and AGENTS.md §8 were amended the same day.
**Resolves:** migration inventory question Q-15 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md)
§8; its pallet names were placeholders).

## Context

The inventory used placeholder pallet names, and left the location and names to the owner under the project's naming
convention. `.cursorrules`, NAMING, read:

> Use Gnostic conventions (Aeons, Archons, Syzygies) for internal logic. Ask for confirmation before naming new
> modules.

AGENTS.md §8 said the same.

## Decision

- **Location:** `chain/` at the repository root.
- **Crates:** `demiurge-node` (the node) and `demiurge-runtime` (the FRAME runtime).
- **Custom pallets:**
  - `pallet-drc369`: DRC-369 semantics over `pallet-nfts` (ADR-025);
  - `pallet-drc369-royalties`: royalty and remix-royalty enforcement (ADR-025);
  - `pallet-sponsorship`: sponsored existence, fees and deposits (ADR-029);
  - `pallet-agent-caps`: spend caps for delegated agents (ADR-026).

## The naming conflict, and how it was resolved

These pallet names are descriptive, under the Polkadot SDK's `pallet-*` convention. They are not Gnostic. But pallet
and crate names are not internal logic:
- a pallet's name, and the instance name it is given in the runtime, appear in the runtime metadata;
- they appear in every extrinsic and event that a wallet, an explorer or an SDK decodes;
- ADR-009 wants DRC-369 to be a standard other developers adopt, so these names are part of what they read.

**Options:**
1. **Keep the names, and amend `.cursorrules`.** Gnostic naming covers internal logic no outside party reads. Crates,
   pallets and anything in runtime metadata use plain, greppable, descriptive names. **Taken by the owner.**
2. **Gnostic names for the pallets:** for example `pallet-syzygy` for sponsorship, `pallet-archon-caps` for agent caps.
   Not taken. Developers outside the project would have to learn the vocabulary before reading an event, and
   `aeons/`, `archons/` and `syzygies/` are directories of dead code in this repository.

`.cursorrules` NAMING and AGENTS.md §8 now say that Gnostic naming is for internals only. Anything that appears in
runtime metadata, or is published to other developers, uses plain, greppable names under the Polkadot SDK convention.

## Consequences

- **The instance names** given in the runtime (for example `Drc369`, `Drc369Royalties`, `Sponsorship`, `AgentCaps`) are
  part of the metadata. They are frozen with the DRC-369 wire format before any SDK is published
  (`beta.wire-format-frozen`).
- **`docs/GATES.toml`:**
  - the chain suite's directory is `chain`;
  - the four pallets are listed under `beta.value-pallet-coverage`, since each moves CGT or owns DRC-369 semantics;
  - `alpha.pallets` is filled in when their required tests exist. A pallet listed with no required tests would count
    as met on existence alone.
- **A fifth custom pallet, `pallet-validator-set`.** A governance-managed validator set needs a session manager
  (ADR-020), and the pinned release ships none for a standalone chain. **The owner approved the name on 17 September
  2026**, on the Q-15 principle: plain and greppable, because it appears in the runtime metadata.
  - Its runtime instance name is `ValidatorSet`.
  - It is not listed under `beta.value-pallet-coverage`: it moves no CGT and owns no DRC-369 semantics. It joins
    `alpha.pallets` with its required tests, like the other four.
