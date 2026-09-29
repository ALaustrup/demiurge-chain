# ADR-057: Eight royalty recipients per asset

**Status:** Accepted, 28 September 2026, by the project owner.
**Answers:** question Q-18 in [`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) §8, and the first of
[ADR-047](ADR-047-the-object-model.md)'s "Open items before the freeze". ADR-047's decision is unchanged:
this confirms the value it set.

## Context

ADR-047 set `MaxRoyaltyRecipients` to 8 as an engineering value. On 22 September 2026 the owner carried it forward as
Q-18, because a song's credits (writers, performers, a publisher, the sources of samples) can pass eight, and the
bound becomes permanent when the wire format freezes. `docs/blueprints/gnosis.md` recommended raising it.

## Decision

**`MaxRoyaltyRecipients` stays at 8.** The owner, 28 September 2026: "eight is enough i believe."

## Consequences

- Q-18 is resolved; `beta.royalty-recipients` in `docs/GATES.toml` reads it as met.
- A work with more than eight parties owed needs its splits grouped before mint, for example a publisher or a
  collective receiving one share and dividing it off chain. `docs/blueprints/gnosis.md` records this as the
  consequence for song credits.
- The bound is part of the frozen format once the freeze happens. Raising it after that is a format change.
