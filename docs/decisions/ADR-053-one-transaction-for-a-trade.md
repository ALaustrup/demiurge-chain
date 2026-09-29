# ADR-053: One transaction for a trade — `pallet-utility`'s atomic batch, and nothing else of it

**Status:** Accepted, 22 September 2026.
**Accepted under the owner's standing delegation for engineering choices.** It invents no economic value, names no
new module — `pallet-utility` is a standard Polkadot SDK pallet, and AGENTS.md §7 asks for a written reason to
*depart* from one, not to use one — and loosens no gate or check.
**Carries out:** roadmap item **M4.6**, for **L4.5** (Trade), asked for by the owner on 22 September 2026: several
assets sent to one address in one approval, with a final warning that ownership moves irreversibly.
**Depends on:** [ADR-052](ADR-052-assets-in-the-runtime.md) (one way in, which this must not widen),
[ADR-037](ADR-037-sudo-on-development-and-test-networks-only.md) (root on development and test networks only),
[ADR-032](ADR-032-chain-location-and-names.md) (the names).

## Context

The owner asked for a trade: a holder picks several of their assets, names a destination, and sends them together.

The runtime could not do it. `Nfts::transfer` moves one asset, and the runtime had no way to put several calls in one
transaction, so a trade of four assets was four extrinsics, four signatures and four independent outcomes. Any of
them can fail on its own — one asset already sold, a nonce race, a node that drops the fourth — and **a half-finished
trade cannot be undone by the protocol.** Whatever arrived is owned by the recipient, and the only remedy is asking
them to send it back. That is precisely the failure a person expects a "trade" not to have, and it is worse here than
in most places, because the dialog before it says the move is irreversible.

`pallet-utility` is the SDK's answer, mounted by almost every chain on the network. Its `batch_all` dispatches a list
of calls and **reverts all of them if any one fails**. The question worth care is not whether to use it; it is what
mounting it opens. ADR-052 spent its fourth decision making `pallet-drc369` the only way an asset comes into
existence, by refusing thirty-five of `pallet-nfts`'s thirty-nine calls in the runtime's base call filter. A batching
pallet that dispatched its contents past that filter would undo that decision in one line.

## Decision

1. **`pallet-utility` is mounted as `Utility` at index 9.** `spec_version` goes to 3. No existing call changes its
   encoding, so `transaction_version` stays 1.

2. **Only `batch_all` is reachable.** The base call filter (`AssetCallFilter`) lets through
   `pallet_utility::Call::batch_all` and refuses every other call of the pallet, pinned by
   `only_the_atomic_batch_of_pallet_utility_is_reachable`:
   - `batch` and `force_batch` **carry on past a failure**. A trade built on either would hand over some assets and
     keep the rest, which is the exact outcome this ADR exists to prevent;
   - `as_derivative` acts from accounts derived from the signer. Nothing needs it, and it would put an asset's
     deposit on an account the holder never sees;
   - `dispatch_as`, `dispatch_as_fallible`, `with_weight` and `if_else` are root-only or serve no purpose here.
     Refusing them costs nothing and keeps the reachable surface one call wide.

3. **It opens no second way to create an asset.** For a signed origin, `batch_all` dispatches each inner call with
   the origin's own filter — this runtime's `BaseCallFilter` — so every call refused outside a batch is refused
   inside one, and the whole batch fails with `CallFiltered`. Only a root origin bypasses filters, and root exists on
   development and test networks only (ADR-037). Read in `pallet-utility` 49.0.1 on 22 September 2026, and pinned by
   `a_batch_cannot_smuggle_a_call_the_filter_refuses`, which puts `Nfts::mint` in a batch behind an allowed transfer
   and finds that nothing was made and nothing moved.

4. **The atomicity is real, and it is the reason for all of this.** Every FRAME dispatchable is wrapped in a storage
   layer by the `#[pallet::call]` expansion, so an inner call's failure reverts the whole transaction rather than the
   failing call alone. Pinned by `a_trade_that_cannot_finish_moves_nothing`, which trades one asset that exists and
   one that does not, and finds the first still with its owner. With `force_batch` in its place, that test fails.

5. **Weights are the SDK's own reference weights** (`pallet_utility::weights::SubstrateWeight<Runtime>`), measured on
   the SDK's reference hardware and not on this chain. **Placeholders, owed to M7.2**, like every other unbenchmarked
   weight here.

6. **How many assets one trade may carry is not decided here.** The pallet's own cap is in the thousands, derived
   from the allocator limit; the real limit is the block's weight. The launcher caps what it offers, in L4.5, and the
   cap is a product decision with a number that can be measured, not an economic value.

## Consequences

- **A trade is one signature, one approval dialog and one outcome.** It happened, or nothing happened.
- **Batching is in the metadata**, so any wallet can build one against this chain — and cannot use it to mint, price,
  swap or re-team anything, because the filter refuses those inside a batch exactly as it does outside one.
- **A message attached to a trade rides in the same batch.** L4.5 uses `System::remark_with_event`, not
  `System::remark`: a message nobody can find is not a message, and the event is what an indexer or the recipient's
  client reads it from. It is public, permanent and readable by anyone, which the launcher says where a person types
  it, again in the warning, and again in the host's dialog.
- **Nothing about royalties changes.** A plain transfer still pays no royalty because none exist (M4.2), and when
  royalty-bearing assets arrive, ADR-025's plan refuses their plain transfer — inside a batch as well as outside,
  since the filter is the same one.

## Alternatives rejected

- **A `transfer_many` call in `pallet-drc369`.** A second implementation of what the SDK already ships, with its own
  weight to benchmark and its own bugs, and it would still need the same filter story. AGENTS.md §7 wants standard
  components unless there is a reason to depart, and there is none.
- **`batch` or `force_batch`.** Not atomic. See decision 2.
- **Several extrinsics submitted together from the launcher.** Each is its own transaction with its own outcome, and
  the person approves each one. It is the status quo this replaces.
- **Leaving all of `pallet-utility` open.** The usual configuration, and it would add calls nothing here needs to the
  surface a filter is supposed to keep narrow. If something later needs `as_derivative`, widening the filter is a
  change with a reason attached, which is the right cost.
