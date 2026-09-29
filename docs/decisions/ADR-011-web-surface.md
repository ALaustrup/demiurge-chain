# ADR-011: Two web surfaces: a public viewer and a thin remote console

**Status:** Accepted, 13 September 2026, by the project owner.
**Amends:** D-011 in `docs/DECISIONS.md`, which made the launcher the only supported client.

## Context

D-011 froze the web applications and made the launcher the only client, because the web hub, the
browser extension, the portal and the CLI each carried their own session handling and their own
version of the protocol. That decision stands for creation and custody. But content that lives only
inside an installed application cannot reach anyone who has not installed it, and a wallet-gated page
cannot be shared or indexed.

## Decision

There are two web surfaces, and they are never merged.

The public viewer needs no authentication. Every published work gets a shareable, indexable page: the
asset, its provenance chain, its creator, its license terms and its price. No wallet is required. This
is how Demiurge content escapes the launcher and reaches people who have installed nothing, and it is
the primary growth surface.

The remote console requires QOR ID authentication and covers wallet operations, CGT transfers, asset
management and project status: read, manage, transact.

Creation, publishing and Mesh seeding stay in the launcher, where the local vault and the node live.
The console is kept thin so that it never becomes a competing second product.

## Consequences

The frozen web applications remain frozen. Whether any of their code (the hub's explorer pages, the
portal's asset page) is reused for the viewer is unknown; the reconciliation report records what each
reads today and from where, and none of it reads a published asset from the chain through the current
node's RPC.

The viewer's data comes from the chain: asset, provenance, creator, license, price all have to be on
chain and queryable for the page to be honest. That is a requirement on the first release's asset work
(ADR-009), not only on the web.

The console signs transactions with QOR ID's delegated keys (ADR-010), not with a browser-held vault
key. The browser extension's bespoke key derivation, which no other wallet can recover, is not the
basis of the console.

Amounts shown on either surface follow ADR-007 and ADR-008.
