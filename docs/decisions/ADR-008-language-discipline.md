# ADR-008: Language discipline

**Status:** Accepted, 13 September 2026, by the project owner.

## Context

How a project talks about its currency shapes what people expect from it and what regulators read
into it. Earlier Demiurge documents and the frozen applications described staking rewards as annual
percentages, named a module "yield NFTs", and in places discussed price and returns. That language
promises appreciation, which ADR-002 rules out as the source of CGT's value.

## Decision

Throughout the codebase, the documentation and the interface, Demiurge is infrastructure for creators
to earn from use, not a vehicle for appreciation. There are no projected returns, no yield framing and
no price talk. Earnings language refers to payment for work, hosting and licensing only.

## Consequences

Words such as APY, yield, return (in the financial sense), ROI, investment, passive income, and any
statement about CGT's price or future value do not appear in copy, comments, names or documentation.
Validators are paid for securing the chain; seeders for storing and serving; creators when their work
is used, licensed or remixed.

The early-seeder effect in ADR-005 is described as an emergent property of paying for consumed work,
never as an opportunity.

Existing violations are listed in the reconciliation report rather than fixed in this documentation
pass, because several are in frozen applications and module names that are not being carried forward.
New code and copy are held to this record from now on, and the pull request checklist is the place to
enforce it.
