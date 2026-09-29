# ADR-028: Provenance comes from events, an archive node and an indexer

**Status:** Accepted, 15 September 2026, by the project owner, who took option A. The indexer named below is chosen on
the evidence gathered the same day, subject to the check in its conditions.
**Resolves:** migration inventory question Q-11 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md)
F-D2).
**Follows:** [ADR-011](ADR-011-web-surface.md), whose public viewer shows each asset's provenance chain, and
[ADR-015](ADR-015-infrastructure-ownership.md), whose infrastructure map this adds to.

## Context

The public viewer shows who owned an asset and when, its transfers and the royalties it paid. FRAME records that
history as events, and events are not queryable history (checked at `polkadot-stable2606-1`, 15 September 2026):
- **Events are one storage value for the current block,** cleared at the start of every block
  (`substrate/frame/system/src/lib.rs:1039-1051, 2263-2266`).
- **By default a node keeps every finalized block body,** but only the last 256 blocks of state
  (`substrate/client/cli/src/params/pruning_params.rs:44, 57-65`). The inventory said non-archive nodes keep no old
  block data; that was too broad. Old block bodies are kept. Old events, which live in state, are not.

The inventory set out two options:
- **A.** Events, plus an archive node and an indexer.
- **B.** Bounded history kept on chain.

## Decision

**Option A.** Provenance comes from the events the runtime emits. An archive node keeps the state of every finalized
block, and an indexer reads those events into Postgres. The public viewer reads the indexer's database. No history is
kept on chain for the viewer's sake.

### The indexer: SQD's squid SDK, self-hosted, reading directly from the archive node

- **It runs entirely on our own infrastructure.** It reads the chain through the node's RPC. SQD's hosted network and
  gateways are optional, carry only public datasets, and are not used.
- **It follows GRANDPA finality.** Its default finality source is `chain_getFinalizedHead`, and it rolls back changes
  from blocks a reorganisation orphans.
- **It suits custom pallets.** It generates a decoder for every runtime version from the chain's own metadata, so the
  events of `pallet-drc369` and the other custom pallets decode correctly across runtime upgrades.
- **It is small:** one processor, an optional GraphQL server, and Postgres on the Fly.io Managed Postgres cluster
  (ADR-015). The schema is designed around provenance (ownership intervals, transfers, royalty payments), not a
  generic history table.
- **It is maintained:** `@subsquid/substrate-processor` 8.8.2 was published on 14 September 2026.

**Conditions:**
1. **Before the indexer is built on,** a spike proves its type generation and decoding against a `stable2606-1`
   development runtime that includes the custom pallets. Its type-generation tools were last published in 2024, and
   support for metadata versions 15 and 16 is unverified.
2. **If the spike fails, the fallback is a Rust ingester built on `subxt`** (0.50, which reads historic blocks across
   runtime versions; licensed Apache-2.0 or GPL-3.0). It is the least locked-in option and matches the codebase. Its
   cost is that reorganisation handling, backfill and the query API are ours to build.
3. **Licence.** SQD's npm packages are GPL-3.0-or-later. The indexer is a service Demiurge runs, not software it
   distributes, so this places no obligation on the rest of the project (Inferred; confirm if the indexer is ever
   distributed).

## Alternatives rejected

- **B. Bounded on-chain history.** It charges deposits forever for data almost nobody reads. It spends block weight on
  every transfer to maintain it, and its bounds would enter the DRC-369 wire format. Events cost none of that.
- **SubQuery.** Workable, but its Substrate node has had no release since November 2025 and its repository no commit
  since April 2026. Its latest node release also predates a SQL-injection fix in its core library.
- **Others.** `substrate-api-sidecar` is deprecated and a REST proxy, not an indexer. Envio, Apibara and The Graph do
  not support Substrate. Parity's `substrate-archive` has been inactive since 2023.

## Consequences

**The archive node is a real operational dependency of the public viewer,** recorded in ADR-015's infrastructure map:
- **It runs as its own Fly.io app with a volume,** with `--state-pruning archive-canonical
  --blocks-pruning archive-canonical`. Finalized history is all the indexer needs, so keeping non-canonical state is
  unnecessary (Inferred from the pruning modes at the tag).
- **Its RPC is private** to the indexer.
- **Its disk grows with every block's state changes,** including the event storage rewritten each block. It is a
  cost line to size and watch. Polkadot's full archive is about 4 TB; a young, lightly used chain is far smaller, and
  no figure can be given for this one yet.
- **If it is down,** new history stops reaching the viewer. The chain itself is unaffected.
- **If it is lost,** rebuilding the index needs a new archive node synced from genesis. A pruned node cannot backfill.

**Events become the provenance interface.**
- Every custom pallet emits complete events: who, what, from, to, and amounts. The indexer cannot recover anything
  an event leaves out.
- Event shapes join the DRC-369 wire format, frozen before any SDK is published (`beta.wire-format-frozen`).

**Other consequences:**
- **A runtime upgrade that changes an event** regenerates the indexer's decoders before the upgrade reaches a
  network the viewer reads.
- **The index is derived data.** It can be rebuilt from the archive node, so it needs no backup beyond the
  database's own. The archive node's volume is the thing to protect.
- **The viewer says how current its history is,** since the indexer can lag.
