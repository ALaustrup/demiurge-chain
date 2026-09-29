# ADR-030: The existential deposit is set against a stated target

**Status:** Accepted, 15 September 2026, by the project owner, **as a method**: the existential deposit is derived
from the target below, never picked. **The value proposed here awaits the owner's confirmation.** The precision it
is written in is U-1, which is open.
**Resolves:** migration inventory question Q-13 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md)
§3.1, F-Q1).
**Follows:** [ADR-003](ADR-003-supply-model.md) (base supply) and [ADR-029](ADR-029-sponsor-pays-the-existential-deposit.md)
(a sponsor pays the existential deposit, and the user then holds that CGT).

## Context

In `pallet-balances` at the pinned release (`polkadot-stable2606-1`, ADR-022; checked 15 September 2026):
- **An account is provided for while its free balance is at least the existential deposit (ED).** Below that, with
  nothing reserved, it is removed from state and the dust is lost.
- **Reserved, held and frozen amounts do not count toward it.** They add consumer references, which stop an account
  being reaped.
- **The ED must be above zero.** The pallet's integrity test panics otherwise, unless a feature it calls a
  denial-of-service vector is enabled (`substrate/frame/balances/src/lib.rs`).

Under ADR-029 the ED plays three parts at once:
1. **The price of onboarding one sponsored account,** paid from the sponsorship budget.
2. **The least CGT any account must hold,** which is what limits how many accounts one holder can keep alive,
   and so bounds dust spam.
3. **CGT a sponsor places in a user's hands,** which is what anyone farming sponsorship with throwaway accounts
   would try to extract.

The owner's target: **sponsoring one million accounts costs a negligible share of the sponsorship budget, while
dust spam stays uneconomic.**

### Precision is not decided

D-000 implemented eighteen decimals, and `.cursorrules` and AGENTS.md repeat it. But D-000 itself, CGT.md §3 and
ADR-003 all say that whether eighteen decimals remains right is **U-1, which is open**, and U-1 is a Public Release
criterion. So precision is not decided anywhere current.

This record therefore states the ED in whole CGT, which does not depend on precision, and gives its atomic
encoding at the implemented eighteen decimals only as an illustration. **U-1 must be decided before the runtime
constant is written** (roadmap M3.2), because the constant is written in atomic units.

## The arithmetic

Symbols:
- **S** = base supply = 10^14 CGT (ADR-003).
- **N** = 10^6 sponsored accounts.
- **B** = the sponsorship budget. Its size is decided nowhere: the genesis split is OPEN-2 and sponsorship mechanics
  are U-4. It is written as a share **f** of supply, B = f × S. **No value of f is chosen here**; the values in the
  tables are illustrations.
- **ε** = what counts as negligible. **Proposed: 0.1% of the budget** (ε = 10^-3). This is a design threshold, not
  an economic parameter, and the owner may set another.

### Constraint 1: sponsoring a million accounts is negligible

N × ED ≤ ε × f × S, so **ED ≤ ε × f × S / N = 10^-3 × f × 10^14 / 10^6 = f × 10^5 CGT.**

| Budget as a share of supply (f, illustrative) | Budget | Largest ED that keeps a million accounts at 0.1% of it |
| --- | --- | --- |
| 1% | 10^12 CGT | 1,000 CGT |
| 0.1% | 10^11 CGT | 100 CGT |
| 0.01% | 10^10 CGT | 10 CGT |
| 0.001% | 10^9 CGT | 1 CGT |

### Constraint 2: dust spam stays uneconomic

A holder of a share **h** of supply can keep at most **h × S / ED** accounts alive, before fees. Fee classes are
OPEN-4, so fees are left out; they only raise the cost.

Each live account costs every node permanent state. One `System.Account` entry is about 160 bytes before trie
overhead (Inferred, to be confirmed against the pinned release):
- the key: two 16-byte prefixes, a 16-byte Blake2-128 hash and the 32-byte account, 80 bytes;
- the value: four `u32` counters and four `u128` balance fields, 80 bytes.

**Proposed spam target:** a holder of 0.01% of supply (h = 10^-4, that is 10^10 CGT) can keep no more than 10^8
accounts alive. So **ED ≥ h × S / 10^8 = 10^10 / 10^8 = 100 CGT.**

| ED | Accounts a 0.01% holder can keep alive | Their account entries (about 160 bytes each, Inferred) |
| --- | --- | --- |
| 1 CGT | 10^10 | about 1.6 TB |
| 10 CGT | 10^9 | about 160 GB |
| 100 CGT | 10^8 | about 16 GB |
| 1,000 CGT | 10^7 | about 1.6 GB |

**What the ED does and does not do.** The ED is held, not destroyed: an actor can consolidate accounts and take it
back. What it buys is a capital requirement, and account state in proportion to holdings. The cost that is
destroyed is fees, whose burn shares are OPEN-4.

## Proposal: an existential deposit of 100 CGT

- **Per account:** 10^-12 of supply. At the implemented eighteen decimals, 10^20 atomic units (illustration only;
  U-1).
- **A million sponsored accounts:** 10^8 CGT, which is 10^-6 of supply. That is at most 0.1% of the sponsorship
  budget **exactly when the budget is at least 0.1% of supply** (10^11 CGT). If OPEN-2 and U-4 set a smaller
  budget, constraint 1 lowers the ED in proportion, and constraint 2's bound loosens by the same factor. That
  trade is the owner's to make at that point, with this arithmetic.
- **Dust spam:** a holder of 0.01% of supply can keep at most 10^8 accounts alive, about 16 GB of account entries
  (Inferred size).
- **Sponsorship farming:** at 100 CGT, a million throwaway accounts would extract 10^8 CGT if the sponsored ED could
  be moved freely. The sponsorship design proposal (`docs/architecture/SPONSORSHIP.md`, U-4) therefore treats the
  sponsored ED as held by the user but not transferable.

## Alternatives

- **10 CGT.** A million accounts cost 10^7 CGT, negligible for a budget of 0.01% of supply. But a 0.01% holder can
  keep 10^9 accounts alive, about 160 GB of entries.
- **1,000 CGT.** Tightens spam to 10^7 accounts. It needs a sponsorship budget of at least 1% of supply to stay
  negligible, and raises what farming extracts tenfold.
- **Zero.** Rejected. Without an existential deposit, any number of empty accounts can be created for the cost of fees
  alone. At the pinned release, `pallet-balances` refuses a zero deposit in its integrity test unless the
  `insecure_zero_ed` feature is enabled, which its own documentation calls a major denial-of-service vector.

## Consequences

- **The runtime constant is written only after two things.** The owner confirms the value, and U-1 is decided.
  Until then, development networks use this value marked as a placeholder (AGENTS.md §5).
- **Other deposits are sponsored too.** Each needs its own sizing: `pallet-nfts` collection, item and metadata
  deposits (ADR-025, F-D7), and proxy deposits for agents (ADR-026). They are covered in the sponsorship proposal.
- **Revisit** if the sponsorship budget is set below 0.1% of supply, or if the per-account state size confirmed
  against the pinned release differs materially from 160 bytes.
