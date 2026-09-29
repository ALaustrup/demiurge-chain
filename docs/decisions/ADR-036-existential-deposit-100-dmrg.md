# ADR-036: The existential deposit is 100 DMRG

**Status:** Accepted, 17 September 2026, by the project owner. This is the value ADR-030 left to them.
**Completes:** [ADR-030](ADR-030-existential-deposit-against-a-stated-target.md), which was accepted as a *method* on
15 September 2026 and proposed this value. ADR-030 is not superseded: its derivation stands and this record supplies
the number.
**Depends on:** [ADR-035](ADR-035-eighteen-decimals.md). The constant is written in atomic units, so precision had to
be settled first.
**Resolves:** the remaining half of migration inventory question Q-13.

## Context

ADR-030 derived the existential deposit from the owner's target rather than picking it: **sponsoring one million
accounts costs a negligible share of the sponsorship budget, while dust spam stays uneconomic.** Both constraints
landed on the same figure:

- **Sponsoring a million accounts is negligible.** At a sponsorship budget of 0.1% of supply, one million accounts at
  100 DMRG costs `10^8` DMRG against a budget of `10^11` DMRG.
- **Dust spam stays uneconomic.** A holder of `10^10` DMRG can keep at most `10^8` accounts alive at 100 DMRG each,
  which is roughly 16 GB of state: expensive for the attacker and survivable for the network.

The owner confirmed on 17 September 2026 that this reasoning holds against the eighteen-decimal unit now fixed by
ADR-035.

## Decision

**The existential deposit is 100 DMRG.** At eighteen decimals that is `100 × 10^18 = 10^20` Sparks, and that is the
form the runtime constant takes.

**It is revisitable before mainnet, and only before mainnet.** If the sponsorship budget is decided at a figure that
changes the arithmetic above, the existential deposit is re-derived from ADR-030's method against the new budget, and
the new value is recorded in a later ADR. The trigger is explicit: **OPEN-2, the genesis allocation split, and the
sponsorship budget that follows from it.** Nobody should read this number as independent of that budget; it was
derived from an assumed 0.1%.

After mainnet it is not revisitable in any ordinary sense: raising it reaps every account below the new figure and
loses their balance as dust, and lowering it is a state-growth decision taken with real accounts in place.

## Consequences

- **The constant can be written** as part of M3's runtime, in atomic units, with a comment naming this record and
  ADR-035 so the two halves of its justification stay attached to it.
- **A sponsor pays it, and the user then holds that DMRG** (ADR-029). So this figure is simultaneously the price of
  onboarding one sponsored account and the amount a sponsorship farmer would try to extract. ADR-030 records that
  extraction bound; the defence belongs to `pallet-sponsorship`, not to this number.
- **It must be above zero,** or `pallet-balances`' integrity test panics at the pinned release. 100 DMRG is not near
  that edge, but a future proposal to lower it towards zero meets a hard floor.
- **A test pins it against the target, not just against itself.** A test asserting `ED == 10^20` proves only that
  nobody typed it wrong. The useful test asserts the two constraints of ADR-030 hold at the chosen budget, so that
  changing the budget without re-deriving the deposit fails.
- **U-1 is closed** (ADR-035), so this is no longer blocked on anything. What remains open around it is OPEN-2.
