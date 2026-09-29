# ADR-006: Five structural demand sinks

**Status:** Accepted, 13 September 2026, by the project owner. Mechanics for three of the sinks are
unaddressed (U-7, U-8, U-9 in `docs/economics/OPEN_QUESTIONS.md`).

## Context

ADR-002 puts CGT's value in demand to spend it. That demand has to come from somewhere structural. A
national currency is grounded by the obligation to pay taxes in it; Demiurge has no such obligation to
lean on and must design its own.

## Decision

Five demand sinks are designed into the system and treated as load-bearing. Each is a case of someone
needing CGT to do something they already want to do.

Mesh hosting: creators pay CGT to store and distribute their work, and seeders earn it. Access gating:
licenses, unlocks, remix rights and entitlements settle only in CGT. Staking for distribution: creators
stake CGT for reach and shelf space in Market and Nexus instead of buying advertising. Agent compute:
AI generation and agent operations spend CGT as a metered resource cost. Escrow and reputation bonds:
collaborations, commissions and licensing deals bond CGT, so that trust itself creates demand.

## Consequences

None of the five exists in the chain today. The reconciliation report records that no licensing,
staking-for-distribution, compute-metering or escrow mechanism is implemented, and that the only
demand for CGT in the running chain is none at all, because transactions cost energy rather than CGT.

Each sink has design questions that must be answered before it is built: what happens to staked
distribution CGT (U-7), who adjudicates a bond (U-8), and who provides and prices agent compute (U-9).
Those are not to be answered by implication in code.

Any later feature that consumes CGT is described in terms of which sink it belongs to, or it justifies
itself as a sixth.
