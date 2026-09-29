# ADR-013: Migrate the base layer to the Polkadot SDK

**Status:** Accepted, 14 September 2026, by the project owner. No migration code is written until the
owner has reviewed the migration inventory,
[`../architecture/MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md).
**Supersedes:** ADR-012, which set a Substrate base as the direction and left the path open; and D-007
(custom slot-scheduled block production, with custom BFT finality to follow) in
[`../DECISIONS.md`](../DECISIONS.md).

## Context

ADR-012 recorded that Demiurge's base is a purpose-built Substrate L1, and that the code does not match.
A check of the build on 13 September 2026 confirmed how far apart they are. The chain in `framework/`
declares no `sp-*`, `sc-*`, `frame-*` or `pallet-*` dependency in any of its eighteen crates
(`framework/Cargo.toml:3-24`), and its core crate says so in its first comment
(`framework/core/src/lib.rs:3`). Block production is a hand-written slot schedule with no finality.
Networking is `libp2p` used directly (`framework/Cargo.toml:54-58`). Storage is RocksDB with a
hand-written Merkle root (`framework/Cargo.toml:61`, `framework/storage/src/root.rs`). The one thing it
shares with Substrate is the SCALE codec (`framework/Cargo.toml:37`). The only Substrate code in the
repository is two pallets under `aeons/` and `packages/blockchain-wasm`, none of which any workspace
builds.

ADR-012 named the ways forward and left the choice to the owner. Three were considered.

| Option | For | Against |
| --- | --- | --- |
| **Keep the custom chain** | A multi-validator devnet already works (milestone M1). Nothing is rewritten. | Finality, fork choice, sync, runtime upgrades and every future hardening would be hand-built and unaudited, in exactly the layer ADR-001 says must be boring. A defect there is silent until value is lost. |
| **Adopt Substrate components inside the custom node** | Keeps some M1 code. | Substrate's block production and finality are built to run inside its own client and runtime framework. Lifting them into a foreign node is not a supported use (inferred; not tested). It carries the cost of both designs and the track record of neither. |
| **Migrate to the Polkadot SDK** | Consensus, finality, networking, storage, transaction validity and runtime upgrades come from components with production history. Engineering attention moves to the layer where Demiurge is meant to be different. | Most of the custom base, including the M1 work, is retired. Every wire format, the RPC API and the launcher's chain client change. FRAME imposes its own discipline (weights, bounded storage, deposits, no floating point) on the creative-layer pallets. |

## Decision

Migrate. Demiurge's base layer is rebuilt on the Polkadot SDK: the Substrate client and a FRAME runtime.

The owner's reasoning: consensus, finality, storage and runtime upgrades sit in the innovation budget's
boring category, where failure is silent and unrecoverable. Hand-built finality and fork choice are not
where Demiurge should spend its originality. The creative layer is where Demiurge innovates: DRC-369
semantics, royalties, agent rails and the economics.

That reasoning becomes four rules.

1. **The stay-boring layer uses standard components as shipped.** That covers block production and
   finality, networking, storage and the state root, transaction format and validity, account nonces,
   runtime upgrades and genesis. Departing from a standard component needs a written reason in an ADR
   (ADR-001).
2. **Custom pallets are for the creative layer.** That covers DRC-369, royalties and remix, agent
   delegation and spend caps, the economic mechanisms (genesis release, perpetual issuance, burn,
   sponsorship) and Mesh payments. They are written against FRAME's constraints from the start.
3. **The migration carries semantics, not code.** Each custom module's behaviour and tests define what
   its replacement must do. Code is rewritten for FRAME where needed, not transliterated.
4. **The migration inventory comes first.** It maps every custom module to a standard pallet, a custom
   pallet or an open question. The owner reviews it before any migration code is written.

## Consequences

The custom consensus, networking, storage, node and RPC crates (`framework/consensus`,
`framework/network`, `framework/storage`, `framework/node`, `framework/rpc`) and the runtime dispatch in
`framework/core` are retired once the new chain reaches parity. They are not extended in the meantime:
no finality, fork choice or sync work is done on them. The custom devnet stays runnable as the
behavioural reference until it is replaced, and `docs/protocol/PROTOCOL.md` keeps describing it until
then.

The M1 decisions survive as requirements, not as implementations. On-chain nonces (D-004), atomic
transaction execution (D-005), a state root over consensus state only (D-006) and state changing only
through blocks (D-008) are all properties the standard FRAME components provide. Whether the standard
signed payload meets D-009's domain separation, by committing to the genesis hash and runtime version,
is expected but is verified against the pinned release rather than assumed. The M1 live checks (a
transfer settled identically on every validator, a refused replay, a restarted validator resyncing)
become acceptance tests for the new chain.

Every wire format changes before any public network exists: the transaction format and signing
payload, the block header, the state root, genesis (a chain specification), the RPC API and address
display. Nothing has been published on the custom formats, so nothing external breaks. The launcher's
chain client is rebuilt; its vault is not.

CVP, the zero-knowledge module and the modular-consensus and sharding files are not carried forward
(D-010, ADR-001).

The decision opens base-layer questions that this record does not answer. They are listed in the
migration inventory: whether "L1" means a standalone chain or a parachain; the block-production and
validator-set mechanism; which governance pallets, which touches U-10; the Polkadot SDK release to pin;
the address format and prefix; and the key scheme for launcher accounts and third-party wallets.

FRAME makes some things in DRC-369 and QOR ID harder rather than easier. Examples are asset history,
nesting, physics values, sponsorship for accounts that hold nothing, and the meaning of "session keys".
The inventory flags each one with its evidence.

U-5 in `docs/economics/OPEN_QUESTIONS.md` is resolved by this record.
