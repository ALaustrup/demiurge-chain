# ADR-031: No fungible game items in the first release

**Status:** Accepted, 15 September 2026, by the project owner. The same day, the owner let `pallet-assets` into the
runtime **for fractionalization only** (ADR-025). **That is not a reversal of this decision** (below).
**Resolves:** migration inventory question Q-14 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md)
§3.5, the game-assets row).

## Context

`framework/modules/game-assets` defines fungible game items keyed by game and asset type. Every one of its calls is a
no-op (`framework/modules/game-assets/src/assets.rs:31-82`; Verified repo). The standard way to hold fungible assets on
the Polkadot SDK is `pallet-assets`.

ADR-009 makes game assets the flagship proof of the first release, because statefulness, nesting, physics properties,
remix royalties and sponsored fees all matter at once in a game asset. Those are properties of individual,
non-fungible assets under DRC-369.

## Decision

**Fungible game items are out of the first release.** `pallet-assets` is used for game items only when there is an
actual game that needs them, through an ADR of its own. Nothing from the current `game-assets` module is carried.

## `pallet-assets` for fractionalization is not a reversal

`pallet-nft-fractionalization` locks a `pallet-nfts` item and mints its fractions as a `pallet-assets` asset (Verified at
`polkadot-stable2606-1`, ADR-022). Deferring fractional ownership past M4 would cost more than carrying the pallet, so
the owner let `pallet-assets` into the runtime for that purpose (ADR-025).

- **Fungible game items are still out of the first release.**
- **`pallet-assets` being present is not permission to build them,** nor any other fungible asset besides fractions.
- **Asset creation is closed to accounts.** The pallet's own creation origin admits no signed account, so the only way
  an asset comes into existence is `pallet-nft-fractionalization` fractionalizing an item. Governance keeps the
  pallet's force origin for repairs. The exact configuration is settled and tested in M4.3, where it is checked that
  fractionalization's route through the pallet's traits is the only one that creates an asset (Inferred from the
  pallet's configuration types; confirmed then).
- **Using `pallet-assets` for anything else** needs its own ADR, as fungible game items do.

## Consequences

- **The inventory's game-assets row** becomes Not carried.
- **ADR-009's flagship is unchanged.** It is non-fungible, stateful game assets under DRC-369 (ADR-025). What is
  deferred is fungible items: currencies, stackable consumables and similar.
- **The DRC-369 wire format and the SDK** do not assume a fungible game item type.
