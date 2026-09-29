# ADR-062: Royalty terms a creator can correct, and a remix share that never rises on remixers

**Status:** Accepted, 29 September 2026, by the project owner, who asked for "the one that ensures the best results
and least amount of friction for users while also ensuring platform stability".
**Supersedes:** decision 2 of [ADR-061](ADR-061-royalties-and-the-settled-sale.md), "terms are set once … and never
change". **Confirms:** ADR-061 decision 4, one level of remix royalty. Every other decision in ADR-061 stands.

## Context

ADR-061 left two product-shaped choices to the owner before the wire format freezes. The owner asked for the option
with the least friction for users that keeps the platform stable.

**Decision 4, one level of remix royalty,** is the stability choice. Paying every ancestor means reading every
ancestor's terms inside a sale — up to sixteen levels, 128 payments — which ADR-047 decision 11 forbids, and
flattening the ancestry into each asset needs a bound the eight-recipient limit cannot give. Every sale does a bounded
amount of work, whatever the remix graph looks like. It is kept.

**Decision 2, terms that never change,** fails the friction test. A creator who types 1% for 10%, or names the wrong
account, is stuck with it for the life of the work. The protection it bought can be had more cheaply, because the
people terms can hurt are only two: **a holder**, whose next sale they tax, and **a remixer**, whose sales pay the
remix share upstream.

- A holder is protected if terms cannot change while anyone but the creator holds the asset. While the creator holds
  it, the only sale the terms can tax is the creator's own, and whoever buys next sees the terms before paying.
- A remixer is protected if the remix share cannot rise once a remix exists. Lowering it only helps them; changing
  who receives it does not change what they pay.

## Decision

1. **The creator may set and change an asset's terms whenever they hold it.** The creator is the owner of the
   collection it was minted into, as before. Once anyone else holds the asset, its terms cannot change — not by the
   holder, and not by the creator — until the creator holds it again.
2. **Once an asset has been remixed, its remix share may be lowered and never raised.** `pallet-drc369` counts, per
   asset, the remixes that name it (`RemixCount`, written only by a remix's mint). While the count is above zero,
   `set_terms` refuses a remix share above the current one (`RemixShareLocked`); a work remixed before it had terms
   has a remix share of zero and keeps it. Recipients and their shares may still change.
3. **Remix royalties stay one level deep** (ADR-061 decision 4, confirmed).

## Consequences

- `TermsAlreadySet` is gone and `RemixShareLocked` is new; `RemixCount` is a new storage item. None of this was ever
  committed or deployed, so it ships inside ADR-061's `spec_version` 4.
- A creator can fix a mistake at any time before the first sale or gift, and again whenever the work comes back to them.
- Nothing a holder or remixer relied on can change under them.
- An indexer reads the terms in force at a sale from the latest `TermsSet` before it; `Sold` still lists every payment.
- Both choices become part of the frozen format at `beta.wire-format-frozen`.
