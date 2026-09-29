# ADR-009: First release: universal minting, with game assets as the flagship

**Status:** Accepted, 13 September 2026, by the project owner.

## Context

The earlier roadmap treated the launcher's surfaces (Library, Agora, Mesh) as the product and left the
asset standard as one module among many. The audit found that DRC-369 is the most complete thing in
the chain workspace and the least connected: its state, royalty, rental, fractional and physics code
exists, but minting is reachable only through a development-only RPC method and nothing enumerates
what an account owns. A release that made a single vertical excellent would have had to build all of
that anyway.

## Decision

The first release makes the asset primitive excellent, not any single vertical.

Universal minting is the floor: anyone uploads any file and mints it as a single asset or a collection,
on chain, through Studio or the SDK.

Game assets are the flagship proof, because statefulness, nesting, physics properties, remix royalties
and sponsored fees all matter at the same time in a game asset, which makes it the clearest
demonstration of what DRC-369 does that other standards do not. Music is the strongest second: the
cleanest per-play micropayment story, exercising less of the standard.

SDKs ship alongside the release, so that third-party wallets, marketplaces and engines can support
DRC-369 from the start. Demiurge is a standard others adopt, not a walled garden.

## Consequences

The critical path to the first release is the one in the reconciliation report §5: DRC-369 minting and
transfer as signed transactions that any node includes, enumeration by owner, a content fingerprint
per asset, and an SDK that signs the same payload the node verifies. The existing TypeScript SDKs call
methods that are now development-only or use signing schemes the node does not accept, and are rebuilt
against the transaction path rather than patched.

Collections, which the module does not model, become a first-class concept.

The DRC-369 wire format and token identity move into the "expensive to change" category the moment an
SDK is published, so they are settled before that, not after.
