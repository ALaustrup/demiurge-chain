# ADR-052: Assets in the runtime — `pallet-nfts` configured from recorded sources, placeholder deposits, and one way in

**Status:** Accepted, 22 September 2026.
**Accepted under the owner's standing delegation for engineering choices.** It invents no economic value: the one
kind of value here that nobody has decided, the deposits, is written as a placeholder and opened as U-14 in
[`OPEN_QUESTIONS.md`](../economics/OPEN_QUESTIONS.md). No pallet is named beyond ADR-025 and ADR-032, and no gate or
check is loosened.
**Carries out:** roadmap item **M4.1**, on the owner's instruction of 22 September 2026: mount `pallet-nfts` with
"config values recorded with a source, nothing invented", and add `pallet-drc369` with only what M4.1 needs.
**Depends on:** [ADR-025](ADR-025-drc369-on-pallet-nfts.md) (`pallet-nfts` is the ledger),
[ADR-030](ADR-030-existential-deposit-against-a-stated-target.md) and
[ADR-036](ADR-036-existential-deposit-100-dmrg.md) (the arithmetic and the value the placeholders come from),
[ADR-032](ADR-032-chain-location-and-names.md) (the names), [ADR-035](ADR-035-eighteen-decimals.md) (scaled
arithmetic), [ADR-037](ADR-037-sudo-on-development-and-test-networks-only.md) (sudo on development networks only),
[ADR-047](ADR-047-the-object-model.md) (the format).

## Context

ADR-025 put DRC-369 on `pallet-nfts`, and ADR-047 decided the format. Neither configured the pallet. `pallet-nfts`
has twenty-six configuration items at the pinned release. ADR-047 set five of them (the two identifier types and the
three string bounds) and named six more as bounds that become wire format, without giving them values. Five more are
deposits, which ADR-030 said "each need their own sizing" and which nothing has sized: the sponsorship proposal says
who pays, not how much, and it is a proposal.

And `pallet-nfts` arrives with thirty-nine calls of its own. Several of them would make or change an item without
`pallet-drc369` knowing: creating a collection, minting a bare item into it, burning an item whose DRC-369 record
would then outlive it, or a creator handing their collection's admin and issuer roles to someone else.

## Decision

1. **Both pallets are mounted,** `pallet-nfts` as `Nfts` at index 7 and `pallet-drc369` as `Drc369` at index 8
   (instance names per ADR-032). `spec_version` goes to 2; no existing call changes its encoding, so
   `transaction_version` stays 1.

2. **Every bound has a source, and the source is in the code** (`chain/runtime/src/assets.rs`), pinned by a test
   (`the_asset_bounds_are_the_ones_recorded_with_a_source`):
   - identifiers `u32`/`u32` and `StringLimit`/`KeyLimit`/`ValueLimit` 256/64/256 are **ADR-047's**;
   - `ApprovalsLimit` 20, `ItemAttributesApprovalsLimit` 30, `MaxTips` 10, `MaxAttributesPerCall` 10,
     `MaxDeadlineDuration` twelve thirty-day months, and every feature enabled, are **Asset Hub Westend's**
     `pallet_nfts::Config` at the pinned tag, `polkadot-stable2606-1`
     (`cumulus/parachains/runtimes/assets/asset-hub-westend/src/lib.rs`, read on 22 September 2026). ADR-047 already
     took its string bounds from the same chain. It is the one `pallet-nfts` configuration every wallet and indexer
     has met, and choosing it is choosing not to invent a second. Its deadline is counted in six-second blocks, and
     so is this chain's;
   - `pallet-nfts`'s pallet test values (`ApprovalsLimit` 10, `MaxAttributesPerCall` 2 and so on) were **not** used:
     they are sized for a test, not for a chain.

3. **The deposits are placeholders, derived rather than picked, and opened as U-14.** One storage entry costs one
   existential deposit, because ADR-030 priced one account entry of about 160 bytes at exactly that; one byte costs
   a hundred-and-sixtieth of it, 0.625 CGT, computed with the SDK's ratio helper (ADR-035). A collection is five
   entries (500 CGT), an asset four (400 CGT), a name one entry plus its bytes (100 CGT plus 0.625 CGT a byte). A
   creator's first mint with a four-byte name therefore holds 1,002.5 CGT, and each later one with the same name
   502.5. Every one is marked **PLACEHOLDER (U-14)** where it is defined. `public-release.economics-decided` counts U-14, so no public
   network can open on them.

4. **One way in.** The runtime's base call filter lets through, of `pallet-nfts`'s calls, only `transfer`,
   `approve_transfer`, `cancel_approval` and `clear_all_transfer_approvals`. Everything that creates, mints, burns,
   destroys, re-teams, re-names, locks, prices or swaps is refused. `CreateOrigin` refuses every origin as well, so a
   collection cannot be created through `pallet-nfts`'s own call even if the filter is later widened by mistake.
   `pallet-drc369`'s `mint` reaches `pallet-nfts` through its traits, which no filter sees, and is the only way an
   item is made. A root call through `pallet-sudo` bypasses the filter, on development and test networks only
   (ADR-037).

5. **What `pallet-drc369` stores, by the owner's M4.1 instruction and ADR-047:**
   - the content reference, `origin` and `current`, exactly ADR-047's 41 bytes; a mint accepts only the BLAKE3-256
     tag today (decision 1), and refuses a reference whose manifest is zero bytes;
   - **the pinned commit**, on chain. ADR-047 decision 8 put the commit in the manifest; the owner's M4.1
     instruction adds it to the record, so an asset says what it was taken from without fetching anything. It is a
     tagged git object id — `Sha1` (20 bytes) or `Sha256` (32 bytes) — never a branch (decision 9), and it moves
     with `current` when an asset is revised;
   - `revisable`, one-way;
   - each creator's singles collection and its next item id, in one entry.

   Its events are ADR-047 decision 12's `Minted`, `Revised` and `Locked` — `Locked` is what making an asset
   permanent emits, and by the owner's instruction it carries the content reference it fixes — plus
   `SinglesCollectionCreated`. `Minted` omits `derived_from` until remix exists (M4.2).

6. **The asset's name is `pallet-nfts` item metadata,** where wallets and explorers already look, set once at mint.
   The filter refuses `set_metadata`, so it is not changed afterwards. The metadata deposit falls on the collection's
   owner, which is the creator (ADR-025).

7. **Owner enumeration is `pallet-nfts`'s own index** (`Account`, keyed by owner), read directly from storage by
   clients and through the `Drc369Api` runtime API, which lists only items that have a DRC-369 record. ADR-025 gave
   `pallet-drc369` "the index of assets by owner"; the index already exists, is kept by `pallet-nfts` on every mint
   and transfer, and a second copy would need a transfer hook `pallet-nfts` does not offer.

8. **Weights are placeholders.** `pallet-nfts` uses its own reference weights (`SubstrateWeight`), benchmarked by the
   SDK on the SDK's hardware; `pallet-drc369`'s three calls are assembled from those plus their own storage
   accesses. **None is benchmarked on this chain: all are debt owed to M7.2.**

## Consequences

- **A creator can mint, revise, make permanent and transfer.** Nothing else about an asset can be changed by
  anyone, which is narrower than `pallet-nfts` alone and is the point.
- **A plain transfer pays no royalty.** None exist yet. ADR-025's plan stands: when M4.2 adds royalties, transfers of
  assets that carry one are refused here and priced sales go through `pallet-drc369-royalties`.
- **A creator's first mint needs about 1,100 CGT free** at the placeholder deposits: the deposits plus the existential
  deposit. On a development chain `chain/scripts/dev-fund.mjs` sends it from Alice; nowhere else can it come from until
  sponsorship (M4.4) and the genesis split (OPEN-2) exist.
- **Revisit** the Asset Hub bounds at the freeze, with ADR-047's open items: they become wire format there.

## Alternatives rejected

- **Zero deposits.** No number to defend, and none to invent. Rejected for the reason ADR-030 rejected a zero
  existential deposit — any amount of state for the cost of fees alone, and this chain charges no fees yet — and
  because it would leave every reserve path in the mint untested until the real values arrive.
- **Values sized per byte of each entry's exact encoding.** More precise, and a precision nobody asked for: the
  numbers are placeholders either way, and "one entry costs what an account entry costs" is ADR-030's own unit.
- **Leaving `pallet-nfts`'s calls open and checking in `pallet-drc369`.** `pallet-drc369` never sees them, so there
  is nothing to check with; a filter is the only place that can refuse them.
- **A second owner index inside `pallet-drc369`.** See decision 7.
