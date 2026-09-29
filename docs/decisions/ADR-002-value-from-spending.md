# ADR-002: CGT's value comes from demand to spend it

**Status:** Accepted, 13 September 2026, by the project owner.

## Context

Creator tokens commonly fail in one way: the creators' earnings depend on the token appreciating.
Payouts are attractive while new holders keep arriving, and stop when they do not. The creators who
built on the platform are then holding a currency that nobody needs for anything, and the platform's
promise to them turns out to have been a bet placed on their behalf.

Demiurge's earlier economic drafts did not state a principle that would prevent this. They described
supply, distribution and rewards without saying what would make anyone need CGT.

## Decision

CGT derives its value from demand to spend it, not from demand to hold it.

Every economic mechanic must pass the spend test: if CGT could never be traded for dollars, would it
still be worth holding? A mechanic that passes creates a reason to need CGT. A mechanic that fails is a
design defect and is recorded as one, with its disposition, in `docs/economics/CGT.md` §9.

## Consequences

The test is applied to fees, rewards, sinks and incentives without exception, including the ones that
already exist in code. Demand is engineered directly, through the sinks in ADR-006, rather than assumed
to follow from scarcity.

Rewards for validators and seeders are payment for infrastructure work that the network consumed, and
are written and reasoned about that way. Nothing in the system pays anyone for holding CGT.

The previous fixed-supply model, whose remaining rationale was scarcity, fails the test on the grounds
in ADR-003 and is superseded.
