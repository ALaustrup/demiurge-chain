# ADR-001: The innovation budget

**Status:** Accepted, 13 September 2026, by the project owner.

## Context

A project that tries to be novel everywhere ends up novel nowhere that matters, and dangerous in the
places where novelty is a liability. Earlier drafts of Demiurge claimed original work in consensus
(Consensus-Verified Polymorphism, hot-swappable consensus, elastic sharding), in cryptography (a
zero-knowledge module whose verifiers all returned true) and in the creator economy at the same time.
The audit of September 2026 found that the security-layer novelties were unsound, unreferenced or
both, while the creative layer, which is where Demiurge could actually differ from other chains, had
the least attention.

## Decision

Work is classified by its failure mode, not by its ambition.

Demiurge innovates hard where failure is loud and recoverable: asset semantics, remix royalty
mechanics, the creator economy, agent rails, creative surfaces, and the incentive design of the Mesh.
Nobody has done these well, a mistake there is visible quickly, and it can be fixed without touching
anyone's keys or balances.

Demiurge stays boring on purpose where failure is silent and permanent: consensus, key custody, vault
design, genesis allocation, the issuance schedule, the address format, the storage layout and upgrade
paths. Proven Substrate components are used there. A silent failure in any of these is discovered
after value has been lost, and cannot be undone.

This is not timidity. Being conservative in the places that cannot be repaired is what buys the freedom
to be radical in the places that can.

## Consequences

Every proposal is first placed in one of the two categories, and the category decides how it is
reviewed. A creative-layer proposal is judged on whether it is genuinely different and whether its
failure would be visible. A base-layer proposal is judged on whether it is the proven choice, and any
departure from the proven choice needs a written reason.

The custom consensus, custody and storage code written before this decision has to be measured against
it. That measurement is in the reconciliation report, and the largest contradiction it surfaces, the
custom chain versus the Substrate base, is recorded in ADR-012 rather than resolved here.

Existing novelties in the base layer that this rule does not justify (the polymorphism engine, the
modular consensus and sharding files, the zero-knowledge module) are not carried forward on the
strength of having been written.
