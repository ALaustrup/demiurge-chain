# ADR-033: Dependency versions: the pinned SDK governs, everything else stays current

**Status:** Accepted, 15 September 2026, by the project owner.
**Follows:** [ADR-022](ADR-022-pin-polkadot-stable2606-1.md) (the chain is built against `polkadot-stable2606-1`).

## Context

The owner wants the ecosystem current, not lagging. Two failure modes pull against that:
- **Drift.** Dependencies that are never upgraded accumulate advisories, and grow expensive to move all at once.
- **Version-compatibility loops.**
  - A Polkadot SDK release fixes the versions of its own crates, and of shared dependencies it constrains.
  - Forcing one crate past what the SDK allows breaks another.
  - Fixing that forces a third, and the work goes in circles.

The loop starts exactly where a crate is pushed forward against the SDK's pins.

## Decision

These rules apply in this order.

1. **The pinned SDK release governs.**
   - Every crate version it dictates is taken as given: its own crates, and the versions of shared dependencies it
     constrains.
   - The SDK's transitive pins are not overridden, with `[patch]` or otherwise. A crate the SDK constrains is not forced
     forward.
   - Code outside the chain that uses a crate published as part of the SDK release (for example `sp-core` for Sr25519
     verification in QOR ID, ADR-023) takes the version from the pinned release, so the chain and its clients verify
     identically.
2. **Everything the SDK does not govern stays current:**
   - QOR ID's dependencies;
   - the launcher, both its Rust host and its frontend;
   - frontend packages;
   - CI actions and tooling.

   Each uses the latest stable versions that work together, upgraded promptly rather than left to accumulate drift.
   Promptly means: when the project is next worked on, and at once when a security advisory affects it.
3. **The SDK pin moves deliberately, on its own.**
   - A move is a single change with its own verification pass:
     - every inventory and ADR claim that relies on the release is re-checked at the new commit, as ADR-022 did;
     - the chain's full test suite runs;
     - weights are re-benchmarked;
     - storage migrations and runtime-upgrade notes are reviewed.
   - It never happens incidentally, during other work.
   - A move is proposed when a release brings something the project needs, when a later patch release of the pinned
     line fixes a security issue, or when the pinned line ages out and stops receiving fixes.
   - Releases are not chased for their own sake.
4. **A blocked version is reported, never left or spun on.** If a wanted version is genuinely blocked by another:
   - say what blocks what, and recommend a way through: wait for a named release, replace the dependency, or accept
     the older version with its reason;
   - do not keep trying version combinations once the constraint is identified;
   - never leave a dependency stuck silently.

## Consequences

- **Lockfiles are committed** and CI builds with `--locked`, as today. An upgrade is a visible change to a lockfile,
  in a commit of its own.
- **A dependency held back** is recorded where the next person will see it: a comment beside it in the manifest,
  naming what blocks it, and a line in `HANDOFF.md`.
- **`cargo audit` exemptions** (`services/qor-auth/.cargo/audit.toml`, `framework/.cargo/audit.toml`) are the recorded
  form of rule 4 for advisories. Each already names its condition.
- **The pin itself stays on `polkadot-stable2606-1`.** On 15 September 2026, `polkadot-stable2606-2` was declined: moving
  would have discarded a re-check of 31 claims for no benefit (ADR-022).
- **This record upgrades nothing by itself.** A drift check of QOR ID, the launcher host and the launcher frontend
  against rule 2 is the next dependency work, done as its own changes.
