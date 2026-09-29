# ADR-025: DRC-369 on `pallet-nfts`, with custom pallets for its semantics

**Status:** Accepted, 15 September 2026, by the project owner, who took option A.
**Resolves:** migration inventory question Q-8 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §3.5,
F-D1 to F-D7).
**Follows:** [ADR-001](ADR-001-innovation-budget.md) and [ADR-009](ADR-009-universal-minting.md).

## Context

DRC-369 in the custom chain covers ownership, mint, transfer, approvals, state and XP, nesting, burn and a single
royalty setting. Rental, fractional ownership and remix royalties are library code nothing calls (inventory §3.5;
Verified repo).

The inventory's options:
- **A.** `pallet-nfts` as the ownership ledger, with custom pallets for DRC-369's semantics.
- **B.** A fully custom DRC-369 pallet.

## Decision

**Option A.**
- **`pallet-nfts` is the ownership ledger.** It holds collections, items, ownership, approvals, attributes and metadata.
- **`pallet-drc369` owns what makes DRC-369 different** (names under ADR-032):
  - nesting, which refuses cycles within a bounded depth (requirement R-2);
  - the physics fields, in fixed point (F-D4);
  - state and XP;
  - the content fingerprint;
  - the index of assets by owner, with its runtime API.
- **`pallet-drc369-royalties` enforces royalties and remix royalties** on the sales and licences it settles (F-D5).

The owner's reasoning: ownership, approvals and collections are commodity; the semantics are where DRC-369 is actually
different. Option A also makes `pallet-nft-fractionalization` available for fractional ownership.

## Alternatives rejected

- **B. Fully custom.** It rebuilds commodity ownership, approvals and collections in the layer ADR-001 wants boring, and
  gives up standard fractionalization.

## Consequences

**Token identity is not preserved.** Today's identity is a Blake2 hash of a counter (`nft.rs:1047-1055`). Nothing is
published on it. A DRC-369 asset is identified by its `pallet-nfts` collection and item, and that identity is part of
the wire format frozen before any SDK is published (roadmap M2.3, `beta.wire-format-frozen`).

**Royalties are enforced by controlling which transfers may happen.**
- `pallet-nfts` transfers and its buy call pay no royalty (inventory F-D5).
- DRC-369 collections therefore lock plain `pallet-nfts` transfers where a royalty applies. Priced transfers go through
  `pallet-drc369-royalties`.
- A plain transfer between two accounts carries no price, so nothing can be enforced on it, on any chain.

**A nested child is locked in `pallet-nfts`,** so it cannot be moved apart from its parent. Nesting's depth and child
limits keep every operation within a block's weight (F-D3).

**Deposits,** checked at `polkadot-stable2606-1` on 15 September 2026:
- `pallet-nfts` reserves a collection deposit, an item deposit, and metadata and attribute deposits (a base plus a
  per-byte rate). Each is a configuration constant, and the types allow zero.
- **Who pays:**
  - the caller of `mint` pays the item deposit, even when minting to another account;
  - `force_mint` charges the collection owner;
  - `mint_pre_signed` charges the recipient.
- **An issuer can therefore pay for minting to another account.**
- **A collection can go without deposits** only when created by `force_create`.
- **The documentation and the code disagree** about `set_metadata`: the documentation says the signer pays, the code
  charges the collection owner. Rely on the code, and test it.

Sponsored minting has to cover these deposits as well as fees (F-D7). The design is in `docs/architecture/SPONSORSHIP.md`.

**`pallet-assets` is in the runtime, for fractionalization only** (the owner, 15 September 2026).
`pallet-nft-fractionalization` mints an item's fractions as a `pallet-assets` asset. Deferring fractional ownership (M4.3)
past M4 would cost more than carrying the pallet.
- This is **not a reversal of ADR-031.** Fungible game items stay out of the first release, and `pallet-assets` being
  present is not permission to build them.
- Asset creation is closed to accounts, so fractionalization is the only route to a new asset (ADR-031).

**Every call is benchmarked** before a public network (F-D8). The bounds on every field enter the wire format (F-D1).

**`docs/GATES.toml`** lists `pallet-drc369` and `pallet-drc369-royalties` among the pallets with coverage requirements once
their names are confirmed (ADR-032).
