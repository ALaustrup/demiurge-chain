# ADR-041: The runtime looks accounts up with `AccountIdLookup`, and an address is a `MultiAddress`

**Status:** Accepted, 20 September 2026, by the project owner.
**Resolves:** migration-inventory question **Q-17**, and closes finding **F-Q10**.
**The case the owner decided on** is [`ADDRESS_TYPE.md`](../architecture/ADDRESS_TYPE.md), which is kept as the
record of the proposal.
**Amends:** [ADR-040](ADR-040-the-launchers-chain-client-is-subxt.md) decision 3, which set the launcher's
`subxt::Config` to `Address = AccountId32` because the runtime used `IdentityLookup`. The launcher's address type
changes with the runtime's, in the same commit. ADR-040's other ten decisions are untouched.

## Context

`chain/runtime/src/lib.rs` set `frame_system::Config::Lookup` to `IdentityLookup<AccountId>`, so an extrinsic's
address field was a bare `AccountId32` and `Balances`' `dest` was a bare account. This was found on 20 September
2026 while building the launcher's chain client, which had to declare its own `subxt::Config` because of it.

The finding was first written up as "a template default, and a legitimate choice". **Checking that claim for the
decision document showed it was wrong**, and that is what decided the question:

- `frame_system::config_preludes::SolochainDefaultConfig` — which the SDK's `solochain` **and** `minimal`
  templates both derive from — sets `type Lookup = AccountIdLookup<Self::AccountId, ()>`
  (`substrate/frame/system/src/lib.rs:399`, at the pinned `polkadot-stable2606-1`).
- The prelude that sets `IdentityLookup` is `TestDefaultConfig` (`:337`), whose `AccountId` is `u64`. It is for
  pallet unit tests, not for a chain.
- Westend and Rococo both declare `pub type Address = sp_runtime::MultiAddress<AccountId, ()>`.

So the line did not inherit a default. It **overrode** the SDK's own solochain default, and no reason for the
override was recorded anywhere. AGENTS.md §7 requires a written reason for a departure from a standard component;
there was none, and writing the decision document failed to find one.

## Decision

1. **`type Lookup = AccountIdLookup<AccountId, ()>`**, and `pub type Address = MultiAddress<AccountId, ()>`, which
   the runtime's `UncheckedExtrinsic` takes as its address parameter.
2. **The launcher moves with it, in the same commit.** Its `subxt::Config` sets
   `Address = MultiAddress<AccountId32, ()>`, and `Balances`' `dest` is `MultiAddress::Id(..)`. A node built before
   this change refuses what the new launcher signs, and a launcher built before it refuses nothing but has every
   transaction refused; the two must not be split across commits.
3. **Now, not later.** The wire format freezes at M5.1. Before it, this is a runtime line, a launcher line and the
   tests that build extrinsics. After it, it is a coordinated breaking release across the chain, the SDK, the
   launcher and every integrator, for one byte — which is to say it would not have been made.

## Why, in one paragraph

The technical difference is one byte per transaction and one enum match per dispatch, neither measurable at any
volume this project will see. `MultiAddress`'s other four variants are unreachable here, because `pallet-indices`
is not mounted. So this is not a performance decision or a capability decision. It is a decision about who has to
know something: every wallet, tool, example and integrator in the ecosystem has met `MultiAddress`, and a client
that assumes it and is wrong gets a refused transaction whose error does not say why. ADR-009 committed the project
to working with the ecosystem's tools, and ADR-023 and ADR-039 already paid harder costs for it — Talisman's
derivation offset was matched exactly so one phrase lists the same accounts in the same order. This is the cheapest
of those three payments.

## What it cost, measured

Carried out the same day it was decided. For the record, against the estimate in `ADDRESS_TYPE.md` §4:

| | Estimated | Actual |
| --- | --- | --- |
| Runtime | One line | Four: the import, `type Lookup`, the new `Address` alias and its use in `UncheckedExtrinsic` |
| Storage migration | None | **None.** Nothing is keyed by the address type; it lives only in the extrinsic envelope |
| `chain/runtime/tests/block_import.rs` | One call site | Two: `new_signed` takes `MultiAddress::Id`, and `transfer_call`'s `dest` |
| `chain/runtime/tests/acceptance.rs` | **"Needs nothing"** | **Wrong: eight call sites.** See below |
| The launcher | One line | Three: the `Config`, the transfer's `dest`, and the live test's funding helper |

**The estimate was wrong about `acceptance.rs`, and the error is worth recording.** `ADDRESS_TYPE.md` said it
needed nothing because it dispatches through `RuntimeOrigin::signed`, which never sees an extrinsic address. That
is true and irrelevant: the `dest` **argument** of every balances call is `AccountIdLookupOf<T>`, which changes with
`Lookup` whether or not an extrinsic is involved. Eight call sites needed it. The correction is in
`ADDRESS_TYPE.md` §4 as well, beside the claim.

This did not change the decision — eight mechanical call sites against a coordinated breaking release is not a
close call — but the owner decided on a document, and a document that was wrong about the cost is worth correcting
whichever way it would have pushed.

## Consequences

- **Every node built before this change is incompatible with every client built after it**, in both directions.
  Nothing is deployed and nothing holds value, so the cost is rebuilding a local node.
- **The metadata changes**, so `chain/README.md`'s recorded metadata sizes are re-measured with it.
- **The launcher still declares its own `subxt::Config`** rather than using `SubstrateConfig`. Two reasons remain:
  this chain has no transaction payment, so its `AssetId` is `()` rather than `u32`; and a configuration that names
  its own types stops compiling if the runtime moves away from them, where a borrowed one would keep compiling and
  start producing transactions the node refuses. That is the failure this ADR exists to remove, so it is not
  reintroduced by accident.
- **`beta.address-type` in `GATES.toml`** reads Q-17's resolution status and is met by this record being accepted.
  It stays in the file: it cost nothing and it is what made the deadline real.
- **F-Q10 is closed** in the inventory, carrying its correction rather than being edited to look as though it was
  right.

## Evidence

Run on 20 September 2026, after the change:

- `chain/`: 51 tests pass, wasm built (not `SKIP_WASM_BUILD`, which cannot build a chain spec and is never
  evidence).
- `chain/scripts/check-two-validators.mjs`: two validators agree, GRANDPA finalises, and a killed validator catches
  up. It signs no extrinsics, so it is evidence that the runtime change did not disturb consensus.
- The launcher: 90 host tests with no node, and the live test against a node built from this runtime — a transfer
  built from metadata, approved, signed in the vault, submitted and finalised; a declined transfer that moves
  nothing; two transfers back to back.
- **The old shape is refused by the new node**, observed rather than assumed: the live test's funding helper still
  passed a bare account on the first run and failed with
  `CannotEncodeCallData(… WrongShape { actual: Array, expected_id: "0" })`.
