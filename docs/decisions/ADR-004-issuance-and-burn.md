# ADR-004: Perpetual issuance for infrastructure, with fee burn as the counterweight

**Status:** Accepted, 13 September 2026, by the project owner. The rate and the burn shares are open
(OPEN-1, OPEN-4 in `docs/economics/OPEN_QUESTIONS.md`).
**Supersedes:** D-002 (staking rewards from a fixed reserve at a stated rate) and the fee numbers in
D-001 (a 0.001 CGT fee split 50% burn, 30% proposer, 20% treasury) in `docs/DECISIONS.md`.

## Context

A chain has two permanent costs: the validators that secure it and, in Demiurge's case, the seeders
that store and deliver content. Under a fixed supply these are paid from genesis pools until the pools
are empty, after which the only income is fees. Demiurge wants fees near zero and often sponsored, so
fee income alone cannot carry the infrastructure. The previous plan's staking reserve, paying a fixed
percentage of its remainder each year, was exactly a pool that runs dry, and its rate was written in
the language of a return on a holding.

## Decision

After the genesis release has decayed, a small perpetual issuance, targeted under one percent a year,
continues. Its designated purpose is to fund the Mesh, meaning storage and bandwidth provision, and
validator security, in perpetuity. It is a paid-infrastructure budget: the network issues CGT to pay
for work it consumed. It is not a reward for holding and is never described as one.

Fee burn is retained as the counterweight. A share of every fee, set per class of fee, is destroyed.
At meaningful transaction volume the burn offsets the issuance and net supply trends roughly flat.

Issuance and burn are documented, modelled and implemented as one balance mechanism. A quiet network
is subsidised by issuance; a busy network returns supply through burn. Neither is described without
the other.

## Consequences

The chain needs an issuance path that does not exist: today the only mints are the development-only
faucet and admin mint in `framework/rpc/src/methods.rs`, and the balances module refuses any mint above
the 13 billion cap (`framework/modules/balances/src/balances.rs:125`). It needs a CGT fee to burn from;
no CGT is charged for any transaction today (`framework/core/src/runtime.rs`, `apply_transaction`
charges energy only).

The exact issuance rate, the burn share per fee class, and the definition of the fee classes are open.
Choosing them requires a model of infrastructure cost and fee volume, not a guess.

The consensus engine's leftover era-reward code and the earlier reserve-emission plan are superseded.
Validator pay is framed and implemented as payment for security work drawn from the release curve and
the issuance budget.
