# ADR-022: Pin the Polkadot SDK at `polkadot-stable2606-1`

**Status:** Accepted, 15 September 2026, by the project owner.
**Resolves:** migration inventory question Q-5 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §8).

## Context

The migration inventory was written against the Polkadot SDK's `master` branch. Its claims are labelled Verified (SDK)
or Inferred, and every one was to be re-checked once a release was pinned (inventory §1).

## Decision

**The chain is built against `polkadot-stable2606-1`:** tag `polkadot-stable2606-1`, commit
`8ae9775dc43c0d8cdd0f6d87700596e14278b1e1`, published 10 August 2026 (node v1.24.1). Every crate comes from that release.
Moving to another release is recorded in an ADR that supersedes this one.

## The re-check against the pinned release

Done on 15 September 2026, before any migration code, by reading source at the commit above.

**Inferred claims about the SDK (9).**
- **One partly wrong: F-D2.**
  - Events are indeed a single storage value cleared every block (`substrate/frame/system/src/lib.rs:1039-1051, 2263-2266`).
  - But "non-archive nodes do not keep old blocks' data" is too broad. By default a node keeps every finalized block
    body and only the last 256 blocks of state (`substrate/client/cli/src/params/pruning_params.rs:44, 57-65`).
  - Old events, which live in state, are gone. Old block bodies are not.
  - The conclusion stands: old events need archive state or an indexer (ADR-028).
- **Three cannot be verified from source, because they are judgements:**
  - F-D3's nesting limits: the premise, that weight is a worst-case bound, is confirmed;
  - F-D8's "cost, not risk": a weight is required, benchmarking is not enforced;
  - F-Q4's claim about third-party wallets. The SDK's own tooling agrees with it: Sr25519 by default, derived from
    the phrase's entropy.
- **Five confirmed:**
  - every call runs in its own storage layer;
  - floating point is to be avoided in the runtime;
  - expiry via lazy checks, bounded hooks or the scheduler;
  - a new proxy scope needs a runtime upgrade;
  - the delegate pays a proxied call's fee.

**Verified (SDK) claims (22), read on `master` on 14 September.**
- **None wrong.**
- **Two partly wrong:**
  - **F-Q3:** proxy types are a type the runtime supplies with trait bounds, normally an enum. The pallet does not
    require an enum (`substrate/frame/proxy/src/lib.rs:148-158`). The consequence is unchanged.
  - **F-D1:** `pallet-transaction-storage`'s limit is the runtime's `MaxTransactionSize`, whose default is 8 MiB. It is
    not a fixed 8 MB (`substrate/frame/transaction-storage/src/lib.rs:66, 176-178`).
- **Twenty confirmed at the tag,** among them:
  - `CheckNonce` refusing a sender with no providers and no sufficients;
  - `CheckGenesis` in the signed payload;
  - `SkipCheckIfFeeless` giving no provider;
  - `pallet-proxy`'s filters, delays, deposits and lack of a spending limit;
  - `pallet-identity`'s model;
  - `pallet-nfts`'s features, limits and deposits, with no nesting and no royalty;
  - `pallet-nft-fractionalization` minting `pallet-assets` fractions;
  - session keys as validator keys;
  - Ed25519 and Sr25519 keys mapping to 32-byte accounts.

The inventory is corrected in the same change.

## Consequences

- **The inventory's evidence** now refers to this release.
- **The pin stays on `polkadot-stable2606-1`** (the owner, 15 September 2026). `polkadot-stable2606-2` was published that
  day, and `polkadot-stable2609-rc1` is a release candidate. Moving now would throw away a re-check of 31 claims against
  this exact commit, for no benefit. A later move follows ADR-033: deliberately, on its own, with its own verification
  pass.
- **Facts found at the tag** that later records rely on:
  - no SDK pallet manages a governance-chosen validator set on a standalone chain (ADR-020);
  - `pallet-staking-async` is for Asset Hub only (ADR-020);
  - a collective motion does not dispatch as Root (ADR-021);
  - the existential deposit must be above zero (ADR-029, ADR-030);
  - who pays each `pallet-nfts` deposit (ADR-025).
