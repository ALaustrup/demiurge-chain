# ADR-024: SS58 addresses, with prefix 42 until mainnet

**Status:** Accepted, 15 September 2026, by the project owner. Addresses are shown in SS58, and hex only in advanced
views. **Development and test networks use prefix 42**, the generic Substrate prefix. The mainnet prefix is decided
before mainnet genesis, as a Public Release criterion.
- The owner first decided on a registered prefix. That could not be carried out, because the ecosystem's registry is
  archived and nothing can be registered in it. The owner corrected the decision the same day, before this record was
  committed.
- The CGT ticker, which that registry lists for another network, is a separate question: U-13.

**Resolves:** migration inventory question Q-7 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md)
F-Q5).

**Clarified 17 September 2026, at the owner's instruction. A prefix check is not chain identification.** The
specification below has QOR ID refuse any prefix but the chain's. That is an input-shape check and a guard against a
Polkadot or Kusama address pasted by mistake. It is not evidence of which chain an address came from, and it must never
be described or relied on as though it were:
- prefix 42 is shared by every chain that uses the generic prefix, so an address from another 42 chain passes it;
- the same 32 account bytes are valid on every Substrate chain, so no address string identifies a chain;
- what identifies this chain is its genesis hash, which `CheckGenesis` binds into every transaction (D-009).

What follows from that is recorded as inventory finding **F-Q9**, with options and a recommendation: no path records an
address that arrived without proof of possession, and the signed challenge is bound to the network by its genesis hash.
It is not implemented; it lands with the migration specified below.

## Context

**How SS58 works at the pinned release** (`polkadot-stable2606-1`, ADR-022; checked 15 September 2026):
- `sp-core`'s `to_ss58check` uses a default format, which is the generic Substrate prefix 42 unless the node sets
  another (`substrate/primitives/core/src/crypto.rs:353-354, 391-393, 417`).
- The runtime declares its prefix as the constant `frame_system::Config::SS58Prefix`
  (`substrate/frame/system/src/lib.rs:642`).
- `from_string` rejects a prefix the registry does not know unless the node calls
  `set_default_ss58_version(Ss58AddressFormat::custom(n))` at start (`crypto.rs:318-324, 411-417`, as read on
  `master`).
- **Encoding.** A prefix of 0 to 63 takes one byte, and 64 to 16,383 takes two. A 32-byte account then encodes as
  47 to 48 characters, or 49. The 2-byte checksum is a Blake2b-512 hash over `SS58PRE`, the prefix and the account
  (Inferred from `sp-core`; confirm when the code is written).

**The registry** (`paritytech/ss58-registry`), researched 15 September 2026:
- **Archived and read-only** since 16 April 2026, according to the repository's own banner. The last network merged
  was Autonomys (pull request #227, 7 October 2024), which is also the date of the last crate release, 1.51.0.
  Registration pull requests opened afterwards were never merged. The README still describes the old process and
  carries no archive notice.
- **While it worked**, a network added an entry (`prefix`, `network`, `displayName`, `symbols`, `decimals`,
  `standardAccount`, `website`) by pull request. Its build refused duplicate prefixes and network names. Reviewers
  told test networks to use 42.
- **Symbol.** `CGT` is registered to Curio, at prefix 777 with 18 decimals (U-13).

## Where registration lives now: nowhere that could be found

Asked by the owner on 15 September 2026. What the public record shows:
- **No registration process exists, and no successor registry.**
  - Issue #221 (opened 27 August 2024, still open) proposed archiving the registry. A Parity maintainer wrote there
    that claiming a prefix "is no longer a pattern we want to encourage", and that the prefix can be read from the
    chain. Another agreed to archive it, "but … provide instructions about what to do instead". No instructions were
    found in the repository, the Polkadot forum, the polkadot-fellows RFCs or docs.polkadot.com.
  - In issue #213 ("Is this repo dead?"), a maintainer described the model as "one unique ss58 per 'consensus
    system'" and said a forum thread would follow. None was found. A standalone-chain team asked what solo chains
    should do and got no process in reply.
  - A forum search for the archive, prefix registration, or standalone-chain prefixes finds no thread about either.
  - docs.polkadot.com still calls the archived repository "the canonical listing".
  - `@polkadot/networks` still depends on the registry's last release. The CAIP-2 profile for Polkadot identifies
    chains by genesis hash and states that no registry maps genesis hashes to networks.
- **What wallets actually use.** They identify a network by genesis hash and read the display prefix from the chain's
  `System.SS58Prefix` constant: polkadot-js extension metadata carries both, and Talisman fetches both from the chain.
  The Polkadot-API team calls that constant "the actual trustless source".
- **Referendum 1217** ("Unifying Polkadot Ecosystem Address Format", Wish for Change track) passed and was executed on
  14 November 2024. It recommends prefix 0 for chains that wish to connect to the Polkadot ecosystem. It is guidance,
  not a rule, and says nothing about standalone chains.
- **The forum threads that come closest** are "UX Proposal: Consensus-Based Address Formats" (February 2024) and
  "Unifying Polkadot ecosystem address format" (September 2024). The second says prefix 42 "was supposed to be used by
  chains that don't want to connect to Polkadot or Kusama". It adds that a chain which might connect later may want the
  relay chain's prefix, to avoid migrating afterwards. It also strongly recommends that the on-chain `SS58Prefix`
  match the prefix displayed, because the metadata hash that signers check (RFC-78) includes it.

**The question has not been posted.** Posting on the forum needs the owner's account. The draft asks three things,
linking thread 10042 and issue #221:
1. whether any registry or process for new prefixes exists today;
2. what the ecosystem recommends for a standalone chain that may later become a parachain (ADR-018): keep 42, set an
   unused number as `System.SS58Prefix`, or something else;
3. whether a `chain:address` or CAIP-style format is expected to replace prefixes.

The answer is recorded when it arrives. It changes no decision here, and it informs the mainnet one.

## Decision

- **Addresses are shown in SS58** wherever a person sees one: the launcher, the public viewer, the remote console and
  QOR ID.
- **Development and test networks use prefix 42.** 42 is the generic Substrate prefix, and exactly what the registry's
  reviewers told test networks to use, so it is not squatting.
- **The mainnet prefix is decided before mainnet genesis** and recorded in a later ADR. `docs/GATES.toml` holds this as
  `public-release.address-prefix`. The options then include:
  - keeping 42;
  - an unused number set as the chain's `SS58Prefix`, since nothing can be registered;
  - prefix 0, if the chain has become a parachain (ADR-018, referendum 1217);
  - whatever registration exists by then.

  None is chosen now. The prefix-0 option is not advised while the chain is standalone: the same address string would
  be valid on Polkadot and on Demiurge, with different balances.
- **Hex (`0x` followed by 64 characters) appears only in advanced views.**

## Consequences

- **The runtime** sets `SS58Prefix` to 42, and the node's default format matches it, so the on-chain and displayed
  prefixes agree (thread 10042's advice). The node calls `set_default_ss58_version` only if a later decision takes a
  number the registry's last release does not know.
- **Prefix 42 does not identify Demiurge.** Many chains share it, test networks among them, Paseo for one. So an SS58
  address with prefix 42 looks the same on Demiurge as on any other chain that uses 42.
  - QOR ID refusing other prefixes (below) stops addresses from Polkadot or Kusama being linked by mistake, but not
    addresses from other chains that use 42.
  - What tells the networks apart is the genesis hash, checked by `CheckGenesis` in every signed transaction (D-009).
  - Clients that show a network name take it from the genesis hash, never from the prefix.
- **A later mainnet prefix** changes every displayed address but not the account bytes. Nothing with a prefix is
  published before mainnet. QOR ID stores bytes (below), so no stored data changes.
- **The launcher** shows SS58 and puts hex in an advanced view (roadmap L3.2). The key scheme changes under ADR-023.
- **QOR ID needs a migration.** Specified here, not written. It lands with the Substrate work, together with ADR-017's
  clearing of derived addresses and ADR-023's key-scheme change.

### Specification: QOR ID accepts SS58

**Today.** `users.on_chain_address` is `VARCHAR(66)`, constrained to `^0x[0-9a-f]{64}$` (migration 009).
`link-keypair`, `link-wallet`, `keypair-register`, `keypair-login`, the challenge route and agent registration all
take a 64-hex Ed25519 key and store `0x` followed by it (`link_verified_key` and `normalise_pubkey` in
`services/qor-auth/src/handlers/auth.rs`). Verified (repo).

1. **Store the account's 32 bytes, not its display string. Recommended.**
   - A new column `chain_account_id BYTEA`, with `CHECK (octet_length(chain_account_id) = 32)` and a unique index.
   - It is backfilled in SQL from the existing column: `decode(substring(on_chain_address from 3), 'hex')`.
   - `on_chain_address` is dropped in a second migration, once no client reads it.
   - Why bytes:
     - an SS58 string depends on the prefix, and the mainnet prefix is not decided;
     - bytes make one account exactly one row, whichever form it arrived in;
     - Postgres has neither base58 nor Blake2b, so an SS58 column could not be backfilled or checked in SQL.
   - The alternative, an SS58 text column with a character-class check, needs application code for the backfill and
     cannot enforce the checksum in the database.
2. **The routes accept SS58 or advanced hex.** Every route above accepts an account as SS58 with the chain's prefix, or
   as `0x` hex in an explicitly advanced field.
   - SS58 is decoded, its checksum checked, and its prefix required to be the chain's, read from configuration, never
     hard-coded to 42.
   - An address with any other prefix is refused. This catches an address from a network with a different prefix, not
     one from another chain on 42, and it is not chain identification (the clarification above, and F-Q9).
   - Both forms normalise to the same 32 bytes before lookup and storage.
3. **Proof of possession uses ADR-023's scheme** (Sr25519), in place of today's strict Ed25519 verification, and no
   route stores an address that arrived without it (F-Q9).
   - The challenge the holder signs carries the chain's genesis hash and network name, besides today's domain
     separator, so a signature proves the holder signed for this network and does not carry to another.
4. **Responses** return `address` in SS58 and `account_id` in hex, the latter for advanced views.
5. **Tests:**
   - an SS58 address with another network's prefix is refused;
   - a bad checksum is refused;
   - a challenge signed for another network's genesis hash is refused;
   - an address offered without a signature is refused, on every route that stores one;
   - the SS58 and hex forms of one key reach the same row;
   - existing rows are backfilled;
   - a derived address (ADR-017) is cleared, not backfilled.
