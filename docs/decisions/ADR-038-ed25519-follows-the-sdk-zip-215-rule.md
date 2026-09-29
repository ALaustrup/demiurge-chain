# ADR-038: Ed25519 verification follows the SDK's ZIP-215 rule, and R-1 is met by standard behaviour

**Status:** Accepted, 18 September 2026, by the project owner.
**Closes:** requirement R-1 in
[`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md), as **met by standard behaviour**.
**Follows:** [ADR-013](ADR-013-polkadot-sdk-migration.md) (standard components; a departure needs a
written reason), [ADR-001](ADR-001-innovation-budget.md) (the innovation budget: stay boring where
failure is silent and permanent), [ADR-023](ADR-023-sr25519-with-ecosystem-derivation.md) (account keys are Sr25519),
[ADR-022](ADR-022-pin-polkadot-stable2606-1.md) (the release this was measured against).

## Context

Requirement R-1 came from the custom chain's worst defect. On 14 September 2026 its non-strict Ed25519
verification accepted a signature nobody made — R as the identity point and s = 0 — for the
identity-point key on 64 of 64 messages and for the all-zero key on 13 of 64. Any account with such a key
could be spent from by anyone. The chain has been untrusted since, and R-1 was written to say the new
chain must reject small-order public keys and non-canonical signatures.

Measured against the pinned release on 18 September 2026, while writing the acceptance tests:

| Scheme | identity-point key | all-zero key |
| --- | --- | --- |
| Ed25519 | **accepted** 64 of 64 | **accepted** 64 of 64 |
| Sr25519 | refused 64 of 64 | refused 64 of 64 |

So R-1, read literally, is met for Sr25519 and not for Ed25519.

**The cause is not the custom chain's cause.** `sp-core` verifies Ed25519 with `ed25519-zebra`, which
implements ZIP-215: a precisely specified validity rule chosen so that every node agrees on whether a
signature is valid. Ed25519 implementations disagree at the edges — that is a documented hazard — and a
blockchain that inherits that disagreement can split. ZIP-215 removes the ambiguity by defining one rule,
and it deliberately accepts some signatures that `ed25519-dalek`'s strict mode rejects. The custom
chain's behaviour was an accident of calling `verify` instead of `verify_strict`; this is a specification
followed on purpose.

## Decision

1. **Ed25519 verification stays as the SDK provides it.** The runtime does not restrict extrinsic
   signatures to Sr25519, and does not substitute its own verifier.
2. **R-1 is closed as met by standard behaviour**, not left half-met. What the requirement was protecting
   against — a chain whose ordinary signature path accepts forgeries — does not exist here.
3. **The measurements stay pinned by tests**, including one that asserts today's Ed25519 behaviour and
   says to delete it if it ever fails.

### Why not restrict to Sr25519 only

The option was real: accept only Sr25519 signatures on extrinsics, which would make ADR-023's choice of
account keys enforced rather than conventional. It was refused, for reasons in this order.

- **It would own a consensus-critical divergence, permanently.** Signature validity is exactly the kind
  of rule where a difference between our chain and every other Substrate chain has to be maintained,
  audited and reasoned about forever, including by anyone writing a client or an SDK against us.
- **In exchange for closing a hole that harms nobody.** The exposure is that an *address* which is a
  small-order Ed25519 point can be spent from by anyone. No secret key produces such an address, so
  nobody holds one; funds sent there are lost to whoever claims them first, exactly as funds sent to any
  other address nobody controls. No person is robbed.
- **The scheme this chain uses is not exposed.** ADR-023 chose Sr25519 for account keys, and Sr25519
  refuses the forgery on every message measured.
- **It is the cleverness the innovation budget exists to refuse.** ADR-001 says to stay boring where
  failure is silent and permanent, and names key handling and consensus as exactly that. A custom
  signature rule in the base layer is that category of change.

## Consequences

- **A client or wallet that signs with Ed25519 works against this chain**, as it would against any
  Substrate chain. Nothing about the standard transaction format changes.
- **ADR-023 remains a convention rather than an enforced rule.** Account keys are Sr25519 by decision and
  by what the launcher generates, not because the runtime refuses anything else. That is recorded here so
  it is not later mistaken for enforcement.
- **If the SDK becomes stricter, a test fails and says so.**
  `ed25519_accepts_the_forgery_which_is_the_recorded_gap_in_r1` in
  `chain/runtime/tests/acceptance.rs` asserts the current behaviour. Its failure is good news and means
  this record should be revisited; the test says that in place.
- **Nothing about the custom chain changes.** It stays untrusted for the reason it always was: its
  verification was non-strict by accident, not by specification, and it is being retired (ADR-013).
- **This does not settle small-order keys elsewhere.** QOR ID verifies Ed25519 with strict verification
  for its own challenge signing, and has its own test. That is a different system with different
  requirements, and it is not changed by this record.
