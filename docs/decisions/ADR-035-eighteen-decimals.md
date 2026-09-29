# ADR-035: DMRG has eighteen decimal places, and scaled arithmetic uses the SDK's helpers

**Status:** Accepted, 17 September 2026, by the project owner.
**Settles:** U-1 in [`docs/economics/OPEN_QUESTIONS.md`](../economics/OPEN_QUESTIONS.md), which is removed from that
file by this record. U-1 was a Public Release criterion and blocked the existential deposit's constant.
**Follows:** [ADR-003](ADR-003-supply-model.md) (the base supply), [ADR-022](ADR-022-pin-polkadot-stable2606-1.md)
(the pinned release whose arithmetic was checked), D-000 (which implemented eighteen and left whether it was right to
U-1).
**Followed by:** [ADR-036](ADR-036-existential-deposit-100-dmrg.md), which could not be written until this was decided.

## Context

Everything about the unit follows from the number of decimal places: the Spark is whatever the smallest unit is, and
every amount in the runtime, in genesis and on the wire is an integer count of Sparks. The custom chain implemented
eighteen, and `.cursorrules`, AGENTS.md §5 and D-000 all state eighteen, but D-000 explicitly left the question open.

**The written justification for eighteen was stale, and this record replaces it.** `denomination.rs` argued there was
"no headroom concern" because the supply in atomic units is `1.3 × 10^28` against `u128`'s ceiling of about
`3.4 × 10^38`, ten orders of magnitude spare. That is arithmetic about the 13,000,000,000 supply, which ADR-003
superseded. The real figure at the base supply of 100,000,000,000,000 DMRG is `10^32` atomic units, so the spare
headroom is about **six** orders of magnitude, not ten. Verified by arithmetic.

**Six orders is enough, and this was checked against the pinned release rather than assumed** (`polkadot-stable2606-1`).
Verified against the SDK source:

- `Perbill` and the other `PerThing` types divide before they multiply (`overflow_prune_mul`,
  `substrate/primitives/arithmetic/src/per_things.rs:536-546`), so taking a fraction of any `u128` amount cannot
  overflow.
- `multiply_by_rational_with_rounding`, which `FixedU128` uses, computes `a * b / c` through a 256-bit intermediate and
  fails only if the *result* exceeds `u128` (`helpers_128bit.rs:187-215`).

What is **not** safe at these sizes is a hand-written `a * b / c` in our own pallets, where `a * b` overflows long
before the result would. That is a code rule, and it would have held whichever precision was chosen.

## Decision

1. **DMRG has eighteen decimal places.** `1 DMRG = 10^18 Sparks`, and the Spark is the atomic, indivisible unit.
2. **The stale headroom argument is corrected in the same change as this record**, restated against the current base
   supply, so nobody re-derives the wrong figure from it.
3. **Scaled arithmetic uses the SDK's helpers, never a hand-written `a * b / c`.** Written as a rule in AGENTS.md §5,
   because it is a rule about every future money path and not only about this decision:
   - a fraction of an amount uses `Perbill`, `Permill` or another `PerThing`;
   - a ratio uses `multiply_by_rational_with_rounding`, or `FixedU128`, which uses it;
   - no money path multiplies two amount-sized values and then divides.
   Every pallet that moves DMRG carries a test pinning the largest intermediate its money paths form.

Chosen for four reasons: nothing in the economic model needs the headroom twelve decimals would buy; the SDK's own
arithmetic does not overflow at eighteen, checked rather than assumed; eighteen is already written into `.cursorrules`,
AGENTS.md and D-000; and it is the ERC-20 default, so a future bridge or wrapped representation needs no scaling
factor, and scaling factors are where this kind of mistake is expensive.

## Consequences

- **Clients cannot use a plain JavaScript number for even one DMRG.** `10^18` is past the `2^53` integer range, so
  every client, SDK and view uses `BigInt` or a big-number library. The launcher already does: amounts never pass
  through a JavaScript number (L1.3), and that requirement is now permanent rather than incidental.
- **The existential deposit's constant can now be written** (ADR-036), because it is written in atomic units.
- **Six orders of headroom is the budget.** Any future mechanic that would form an intermediate larger than about
  `10^32 × 10^6` has to justify itself, and the rule above is what keeps intermediates out of that range.
- **This forecloses cheaply only until an SDK is published or mainnet genesis exists**, whichever comes first. A change
  after that is a wire-format and holder-balance change, not a constant.
- **The decision does not depend on the ticker or the name.** It is about the unit.
