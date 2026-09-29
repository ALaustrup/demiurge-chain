# ADR-037: `pallet-sudo` exists on development and test networks only, and is absent from any mainnet runtime

**Status:** Accepted, 17 September 2026, by the project owner, who holds the key.
**Follows:** [ADR-021](ADR-021-collective-governance-now-opengov-later.md) (collective governance now, full OpenGov
later), [ADR-020](ADR-020-permissioned-validators-now-npos-later.md) (a governance-chosen validator set first).
**Enforced by:** `public-release.no-sudo` in [`docs/GATES.toml`](../GATES.toml).

## Context

M3 builds a chain with no working governance yet: ADR-021 puts a collective in place first and full OpenGov later, and
ADR-020 has the validator set chosen by governance. Until those exist, a devnet with no privileged origin cannot be
operated at all — a runtime upgrade, a wrongly set constant or a stuck validator set would each need a fresh genesis.

`pallet-sudo` solves that, and is the standard component for it, so using it needs no departure from ADR-013's rule.
The risk is not in using it. It is that **a privileged origin that exists is a privileged origin that can be used**,
and "we will take it out before mainnet" is exactly the kind of intention that survives into production as a
single key that can rewrite the runtime.

Leaving it in but unused is not equivalent to removing it. An unused `sudo` is still a call in the runtime's metadata,
still an origin any future pallet can be wired to by accident, and still a key whose loss or theft is catastrophic.
Its absence is what is verifiable; its disuse is not.

## Decision

1. **`pallet-sudo` is in the runtime for development and test networks only.** It is how the devnet is operated before
   governance can execute anything.
2. **The owner holds the sudo key.** It is not shared, not committed, and not held by any service. QOR ID never holds
   it, in line with ADR-014's principle that a service does not hold keys it could act with.
3. **It is absent from any mainnet runtime, not merely unused.** No `pallet-sudo` in `construct_runtime!`, no `Sudo`
   instance, no sudo call in the metadata.
4. **`public-release.no-sudo` is a Public Release gate criterion**, separate from `public-release.opengov` which had
   carried the requirement as a clause. Separating it means the absence is checked on its own and cannot be waved
   through as part of a broader governance tick.

## The removal path, so it is not rediscovered under pressure

Written now, while nothing depends on it, because the moment to design this is not the week before mainnet.

1. **The mainnet runtime is a separate feature set from the start,** not the dev runtime with a line deleted at the
   end. `pallet-sudo` is included behind a runtime feature (for example `sudo`), enabled for the development and test
   chain specifications and never for mainnet. This makes removal a build configuration rather than a code edit under
   time pressure.
2. **Governance must be able to do everything sudo did, before sudo goes.** Removal is blocked until the collective of
   ADR-021 can execute a runtime upgrade, set the validator set of ADR-020, and adjust the constants sudo would have
   adjusted. Removing sudo before that leaves a chain nobody can fix.
3. **The order is: governance proven, then sudo removed, then mainnet genesis.** On a test network, perform a runtime
   upgrade through governance with sudo already disabled, so that the first upgrade without a safety net is not on
   mainnet.
4. **Removal is itself a runtime upgrade,** and the last one sudo is used for is the one that removes it, if the
   ordering above ever slips.
5. **The key is destroyed after removal,** and its destruction recorded. A key that no longer authorises anything is
   still worth not keeping.
6. **The gate criterion is evidence-bearing:** it is met by the mainnet runtime's metadata showing no sudo call, not
   by a statement that sudo is unused.

## Consequences

- **The devnet is operable from M3** without waiting for governance, which is what unblocks the chain work.
- **Two runtime configurations exist from the start**, and both are built in CI once CI runs, so the mainnet
  configuration never goes unbuilt until it matters.
- **Anything that would only work with sudo is a design smell.** A pallet whose only privileged path is `Root` via
  sudo has not answered how it works after removal; ADR-021's collective is the origin to design against.
- **The owner is a single point of failure for the devnet**, deliberately, and that is acceptable for a network that
  holds nothing of value (SECURITY.md). It is not acceptable for mainnet, which is the point of this record.
