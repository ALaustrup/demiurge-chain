# ADR-020: A permissioned validator set chosen by governance now; nominated proof of stake later

**Status:** Accepted, 15 September 2026, by the project owner. The session manager this needs is a custom pallet,
because the pinned release ships none for a standalone chain. **The owner approved its name, `pallet-validator-set`,
on 17 September 2026** (ADR-032).
**Resolves:** migration inventory question Q-3 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §3.3).
**Follows:** [ADR-004](ADR-004-issuance-and-burn.md) (validator pay from the release curve and issuance),
[ADR-018](ADR-018-standalone-chain-grandpa-finality.md), [ADR-021](ADR-021-collective-governance-now-opengov-later.md).

## Context

The custom chain has staking, era rewards, slashing and commission code in `framework/consensus`, and none of it runs:
the node never calls `finalize_block`, and stake exists only in memory (inventory §2, §3.3; Verified repo).

The inventory's options were nominated proof of stake with `pallet-staking`, or a permissioned set changed by
governance.

## Decision

**The validator set is permissioned, and governance changes it.** The set is applied through `pallet-session`. Nominated
proof of stake comes later, by the path below. **None of the custom staking, slashing or reward code is carried.**

The owner's reasoning: staking before CGT is distributed would secure the chain with tokens only the owner holds.

## How it works at the pinned release

Checked against `polkadot-stable2606-1` on 15 September 2026:
- **`pallet-session` needs a session manager** that returns the next set (`SessionManager::new_session`), plus keys
  that validators set with a proof of ownership (`set_keys`). Aura and GRANDPA follow its changes.
- **The release has no pallet for a governance-chosen set on a standalone chain:**
  - `pallet-node-authorization` manages network peers, not validators;
  - `pallet-staking` is nominated proof of stake;
  - `pallet-staking-async` is for the Polkadot and Kusama Asset Hub only;
  - the solochain template fixes its authorities at genesis and has no session pallet at all.
- **`pallet-collator-selection` does not fit.** It has no parachain dependencies, but its own documentation says it
  manages parachain collators, that "Collation is _not_ a secure activity", and it carries a bonded candidate auction
  and a reward pot. On a GRANDPA chain, every candidate who won a slot would become a finality voter.

So the session manager is **a small custom pallet**. That is the written reason ADR-013 rule 1 asks for when the base
layer departs from a standard component: there is none to use. The pallet:
- stores a bounded list of validator accounts;
- lets a governance origin add, remove or replace entries (ADR-021);
- returns the list from `new_session`, applied from the session after next;
- keeps the same storage and calls as `pallet-collator-selection`'s invulnerables, so that a parachain move
  (ADR-018) or the move to staking can swap it out.

`pallet-session` runs with `ValidatorId = AccountId` and `ValidatorIdOf` as the identity. Session keys are Aura and
GRANDPA (ADR-019).

**Misbehaviour** is handled by governance removing the validator. Nothing is bonded, so there is nothing to slash, and
equivocation reporting (`pallet-offences`, historical sessions) is not needed in this phase. It becomes necessary with
staking.

**Validator pay** is payment for security work, drawn from the release curve and issuance (ADR-004, U-11). It does not
depend on staking, and it is built with the economic mechanisms (M6), not here.

## The migration to nominated proof of stake

1. **Preconditions,** each recorded before the migration starts:
   - CGT is distributed widely enough that bonded stake is not one holder's. The measure is set by the owner at the time.
   - Validator income is decided (U-11, with OPEN-1 to OPEN-3).
   - A slashing policy is recorded in an ADR.
   - The voting-power model is decided (U-10), so staking parameters have a legitimate owner.
2. **Choose the staking pallets against the release then pinned.** At `stable2606-1` that is `pallet-staking`, since
   `pallet-staking-async` is Asset-Hub-only. Staking is changing in the SDK, so this is re-checked at the time, not
   assumed from today.
3. **Add the rest:** the staking pallet, historical sessions, `pallet-offences`, equivocation reporting for GRANDPA and
   Aura, an election provider, and the bags list, as that release requires.
4. **Hand over in a runtime upgrade.** The staking pallet becomes the session manager. For a transition period, the
   governance-chosen validators become its invulnerables, so the set cannot collapse while stake arrives.
5. **Retire the custom session manager.** Its storage is removed with a `RemovePallet` migration once the transition
   ends.
6. **Re-examine Aura against BABE** for an open set (ADR-019).
7. **Governance sets the staking parameters** (validator count, minimum bond) under OpenGov (ADR-021).

**`docs/GATES.toml` makes this migration a Public Release criterion.**

## Known unresolved tension

**This record's own precondition may block its own gate criterion.** It is recorded here, and against U-10, so that
whoever revisits it sees the trap rather than rediscovering it. It is not resolved.

- **The reason for waiting.** Nominated proof of stake was deferred because, before CGT is distributed, stake would be
  tokens only the owner holds.
- **The deadline.** The Public Release criterion requires the move before mainnet.
- **The problem.** At mainnet genesis, CGT has barely begun its release: the genesis majority is released over a
  multi-decade curve (ADR-003, OPEN-3). Staking at mainnet could therefore still be secured mostly by whoever holds the
  genesis pools, which is the same problem that justified deferring it.
- **The consequence.** Precondition 1 (CGT distributed widely enough that bonded stake is not one holder's) may still be
  unmet when the criterion requires the move. The criterion would then be blocked by this record's own condition, or
  met by loosening that condition.
- **Nothing is decided here** about which should give way: the criterion, the precondition, or the timing of mainnet.
  It is decided with U-10, OPEN-2 and OPEN-3, which together determine who holds CGT at genesis and whose stake and
  votes count.

## Alternatives rejected

- **Nominated proof of stake now.** It would secure the chain with tokens only the owner holds, and bring staking,
  slashing, elections and payouts into the base layer before anyone else can take part.
- **Reusing `pallet-collator-selection` for validators.** It is built for collators, not finality voters, and its
  candidate auction would have to be proven inert on a GRANDPA chain.
- **Fixing validators at genesis, as the solochain template does.** Changing the set would then need a runtime upgrade
  or a new chain.

## Consequences

- **The custom session manager is `pallet-validator-set`**, approved by the owner on 17 September 2026 (ADR-032). Its
  calls need benchmarks like any other.
- **Genesis names the first validators and their keys.** Who they are is the owner's decision at M3.
- **Safety rests on the named operators and on governance** until staking arrives (ADR-018).
- **The inventory's staking row** becomes Not carried.
