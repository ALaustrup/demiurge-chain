# ADR-005: Useful-work mining on the Mesh, without artificial difficulty

**Status:** Accepted, 13 September 2026, by the project owner. The verification mechanism is
unaddressed (U-6 in `docs/economics/OPEN_QUESTIONS.md`).

## Context

Demiurge needs its content stored and delivered, and it needs a way to bring new machines into the
network. Proof-of-work chains solve the second problem by paying for useless computation and then
raising the difficulty as more machines arrive, because miners compete for a fixed reward. Demiurge has
a real job for those machines to do.

## Decision

The Mesh is Demiurge's mining. Installing the QOR Launcher makes a machine a potential node that
contributes storage and bandwidth. Creators pay CGT to have their work hosted and distributed; seeders
earn CGT for hosting and serving it, verified against content fingerprints recorded on chain.

Difficulty is not artificially escalated. Demiurge does not copy Bitcoin's difficulty adjustment,
because the work here is useful: the correct limiter is real demand, and seeders are paid only for
storage and bandwidth the network genuinely consumes. The network self-balances on need.

Because demand per provider is high while the network is small, early seeders naturally earn more per
unit of work than later ones. That is an emergent property of paying for consumed work. It is not
described as a return, a guarantee or an investment opportunity anywhere in the codebase, the
documentation or the interface.

## Consequences

The chain needs content fingerprints per published work and a way to verify that a seeder stored or
served the bytes it is paid for. Neither exists; the reconciliation report records that the network
layer carries only blocks, transactions and consensus messages today, and that no proof-of-storage or
proof-of-retrieval code exists anywhere in the repository. Designing that verification is the hardest
open question in the Mesh and is listed as U-6.

Seeder payment is one of the designated uses of the perpetual issuance in ADR-004 and one of the demand
sinks in ADR-006, so this record cannot be implemented independently of those.

Interface and documentation copy about seeding is bound by ADR-008.
