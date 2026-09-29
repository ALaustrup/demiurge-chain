# ADR-029: A sponsor pays the existential deposit, and the user then holds it

**Status:** Accepted, 15 September 2026, by the project owner, who took option A. **The sponsorship mechanics are not
decided by choosing A.** They are U-4, proposed for the owner's review in `docs/architecture/SPONSORSHIP.md`.
**Resolves:** migration inventory question Q-12 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) F-Q1, F-D7).
**Follows:** [ADR-001](ADR-001-innovation-budget.md) (stay boring where failure is silent) and
[ADR-017](ADR-017-password-accounts-no-chain-identity-without-a-key.md).

## Context

End users are meant to transact without holding tokens first. On FRAME an account that holds nothing cannot send a
transaction: `CheckNonce` refuses a sender with no providers and no sufficients, and feeless calls do not change that
(inventory F-Q1).

Checked at `polkadot-stable2606-1` on 15 September 2026, `pallet-balances`:
- **The existential deposit must be above zero.** The runtime's integrity test panics otherwise, unless a feature the
  pallet calls a denial-of-service vector is enabled.
- **An account is provided for by its free balance being at least the existential deposit.** Reserved, held and frozen
  balances add consumer references, and do not count toward it.
- **A frozen amount stays in the free balance but cannot be moved.** An account with a freeze cannot be reaped while the
  freeze remains.

The inventory's options:
- **A.** A sponsor pays the existential deposit, and the user then holds that CGT.
- **B.** A sufficient asset.
- **C.** A provider reference granted by a custom sponsor pallet.

## Decision

**Option A, on standard `pallet-balances` semantics.** A sponsor pays a new account's existential deposit. The CGT is the
user's, and the account exists for the ordinary reason, its free balance.

## Alternatives rejected

- **C. A custom sponsor-granted provider reference.** It is a bespoke mechanism sitting directly on account existence,
  which is exactly where failure is silent and permanent (ADR-001). A defect there strands or reaps accounts with no
  visible symptom until value is lost.
- **B. A sufficient asset.** It needs `pallet-assets`, which ADR-031 keeps out of the first release. It also makes
  existence depend on a second asset alongside CGT.

## Consequences

- **What choosing A does not answer is U-4:**
  - how a sponsor is designated;
  - what it pays;
  - how caps are enforced;
  - what stops sponsorship being drained;
  - which fee classes exist.

  These are proposed for review in `docs/architecture/SPONSORSHIP.md`, and nothing is built until the owner decides.
- **Sponsored minting covers storage deposits as well as fees** (F-D7). The proposal covers `pallet-nfts` deposits
  (ADR-025) and proxy deposits for agents (ADR-026).
- **The existential deposit's value** is set by ADR-030. Under this decision it is also what a sponsor places in each
  user's hands, and what anyone farming sponsorship would try to extract.
- **Only accounts with keys can be sponsored.** Every chain account is a key. A QOR ID account with no proven key has
  no chain account to sponsor (ADR-017).
- **Sponsorship moves CGT that already exists and never creates any** (R-3). No service outside the chain can direct a
  sponsor's funds beyond caps the chain enforces.
- **`pallet-sponsorship`** is the custom pallet that carries it (ADR-032).
