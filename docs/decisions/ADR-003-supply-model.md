# ADR-003: Base supply of one hundred trillion CGT, released on a decay curve

**Status:** Accepted, 13 September 2026, by the project owner. The split and the curve are open
(OPEN-2, OPEN-3 in `docs/economics/OPEN_QUESTIONS.md`).
**Supersedes:** the fixed supply of 13,000,000,000 CGT stated in `.cursorrules` and encoded in
`framework/primitives/src/denomination.rs:54`; D-003 (genesis distribution) in `docs/DECISIONS.md`;
the 13 billion figure in D-000, whose eighteen-decimal precision is not affected.

## Context

The previous plan fixed CGT at 13 billion units, all allocated at genesis, with no issuance afterwards
and a fee burn. Three problems with it became clear once the creator economy was designed in detail.

Per-use pricing at eighteen decimals produced prices like 0.000001 CGT, which are illegible, and which
every creator would have to revise whenever the currency moved. A fixed supply with near-zero fees left
no perpetual income for validators or for the people storing and serving content; the genesis pools
would pay them for a while and then run dry. And a fixed, burning supply rewards holding over spending,
which is the opposite of what a currency for paying creators needs.

## Decision

The base supply is 100,000,000,000,000 CGT, one hundred trillion. The number is chosen so that everyday
amounts display as ordinary-looking figures. It is not a scarcity signal; ADR-002 puts CGT's value
elsewhere.

The large majority of the base supply is allocated at genesis and released over a multi-decade decay
curve to validators, seeders, the treasury and the creator and player rewards pool. The shares, the
curve's shape and its duration are open and are not to be invented.

This supply is complemented by the perpetual issuance and burn mechanism in ADR-004; the two records
describe one model.

## Consequences

The 13 billion figure has to leave the code: the constant in `denomination.rs`, its mirror in the
launcher (`tools/qor-launcher/src-tauri/src/cgt.rs:48`), the supply cap in
`framework/modules/balances/src/balances.rs:125`, the tests that pin all three, and every document that
states it. The reconciliation report lists each occurrence.

Genesis allocation moves from a flat balances map to named pools with release schedules. That is
"stay boring" territory under ADR-001: the mechanism should be a proven one, and the values, once
chosen, are irreversible at mainnet genesis.

Precision is not decided by this record. Eighteen decimals with one hundred trillion units fits the
`u128` balance type; whether eighteen remains the right choice is listed as U-1 in the open questions.

The earlier vesting terms for the team allocation are withdrawn with D-003; nothing replaces them yet
(U-12).
