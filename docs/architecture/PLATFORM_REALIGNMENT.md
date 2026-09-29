# Platform Realignment

**Status:** Audit record. Its findings remain an accurate record of what was
wrong on 11 September 2026. Its ordered work list (§3.3) and CGT table (§3.4) are
**superseded** by [`docs/DIRECTION.md`](../DIRECTION.md), the only roadmap, and
[`docs/DECISIONS.md`](../DECISIONS.md), the only decision log.
**Date:** 11 September 2026

> **Everything below describes the repository as it was on 11 September 2026.** Its subject was largely
> `framework/`, deleted at M3.5 on 20 September, and its §3.3 work list is superseded by
> [`../DIRECTION.md`](../DIRECTION.md). Read it as a record of what was found, never as current state.

> ### Fixed since this audit was written
>
> Items 1 to 3 of §3.3 are done, plus a defect the audit did not find. All
> verified against a running node; the workspace is green at 231 tests.
>
> | Fix | Evidence |
> | --- | --- |
> | `chain_submitTransaction` registered | 7 new tests in `rpc/tests/submit_transaction_test.rs` |
> | Runtime publishes block height (`Runtime::begin_block`) | Transactions execute at all, for the first time |
> | **CGT transfers settle inside blocks** | 2,500 Sparks moved in block #24 on a live node |
> | `drc369_mint` requires a signature | Forged mint refused with "Signature verification failed" |
> | Faucet signed and off by default (`--faucet`) | Refused as "not enabled"; forged claim refused |
> | 13B supply cap enforced on all mint paths | `credit_total_supply` gates faucet and admin mint |
> | **CGT redenominated to 18 decimals** | 0.000001 CGT transferred and settled on a live node |
> | One canonical denomination in `primitives` | `balances` and `agentic` can no longer disagree |
> | Treasury and burn accounts defined | `primitives/src/accounts.rs`, unspendable by construction |
>
> §2.1 and §2.2 below describe the state *before* these fixes and are kept as
> the record of what was wrong. §2.9 documents the additional defect.

This document records an end-to-end re-evaluation of the Demiurge codebase and
the architecture it implies going forward. It is written to be useful rather
than flattering. Where the repository claims something works and it does not,
that is stated plainly, with the file and line that settles it.

The short version: **the foundation is more real than a sceptic would guess and
much less finished than the README claims.** The Rust workspace compiles, the
node runs, the RPC server answers, the request-authentication scheme is properly
designed, and roughly forty thousand lines of Rust are not vapour. But the chain
cannot currently move CGT in a way that would survive contact with a second
validator, and several endpoints mint value with no authentication at all.

---

## 1. What was verified, and how

Everything below was checked against the source, and the chain claims were
checked by running it.

| Check | Method | Result |
| --- | --- | --- |
| Does the chain compile | `cargo check --workspace` | Yes, warnings only |
| Does the node run | Launched `demiurge-node.exe` with RPC | Yes |
| Does RPC answer | `chain_getBlockNumber` over HTTP | Yes, returned `0` |
| Does the node produce blocks | Ran without a validator key | No, as expected |
| Is `rpc_methods` exposed | JSON-RPC call | No, method not found |

So: a working single node with a live JSON-RPC surface. That is a real
foundation and the realignment builds on it rather than replacing it.

---

## 2. The findings that change the plan

### 2.1 CGT transfers never enter a block

`framework/rpc/src/methods.rs:395-408` executes a transfer by writing the two
balances straight into RocksDB. Its own comment says so:

```rust
// Execute transfer directly via storage (MVP path - in production use tx pool)
self.storage.put(&from_key, &new_sender_balance.to_le_bytes());
self.storage.put(&to_key, &new_recipient_balance.to_le_bytes());
```

This is not confined to transfers. There are roughly twenty-seven such direct
writes across balances, staking, validator registration and NFT minting.

The consequences are not subtle:

- **There is no transaction history.** A transfer produces a hash computed from
  a Blake2 of the fields plus a timestamp, but no transaction object exists and
  no block contains one. Nothing can be audited, explored, or proven after the
  fact.
- **State diverges the moment a second node exists.** Each node writes to its
  own database. Block sync would then overwrite whichever local edits lost the
  race. Balances would silently change.
- **No consensus means no finality.** A "confirmed" transfer is a row in one
  node's local key-value store.

A transaction pool exists and works (`chain_submit_transaction`,
`methods.rs:317`), and the runtime has a proper module dispatch. They are simply
not connected to any of the economic endpoints. Worse, `chain_submit_transaction`
is **never registered on the RPC module**, so there is presently no public way to
submit a transaction at all. The entire runtime, module and block pipeline has no
client entrypoint.

**This is the single blocking issue for treating CGT as money.** No exchange can
list an asset whose transfers do not appear in blocks.

### 2.2 Two endpoints create value with no authentication

- `drc369_mint` (`methods.rs:1718`, registered at `server.rs:533`) has no
  signature check. Its own docstring says `/// In production, this should require
  admin signature verification.` Anyone who can reach the RPC port can mint an
  NFT to any owner.
- `balances_claimStarter` (`methods.rs:450-492`) writes 10,000 Sparks to any
  address with a zero balance. The only gate is "does this address already have
  a balance", which is defeated by generating a new keypair. Keypairs are free
  and infinite.

Neither updates `Balances:TotalSupply`. Combined with the direct-write path,
**the 13 billion supply cap is not enforced by anything.**

The contrast is instructive: the *authenticated* endpoints are well built. The
scheme in `framework/rpc/src/auth.rs` is genuinely good work, with an injective
length-prefixed encoding, a domain separator, method-name binding and a nonce
consumed under a mutex. It has eleven unit tests. The problem is not that the
team cannot build authentication. It is that two endpoints were registered
without it.

### 2.3 The security centrepiece does not hold

The README leads with Consensus-Verified Polymorphism. The default proof
generator is `TranslationValidation` (`cvp/engine.rs:197-198`), whose "proof" is
a Fiat-Shamir challenge and a response computed as

```
Blake2b512("CVP_RESPONSE_V1" || challenge || epoch_seed || rules_root)
```

Every input is public (`cvp/proof.rs:395-490`). There is no witness and no
secret, so anyone can compute a valid response. It is not a proof of anything.
The alternative `PlaceholderProofVerifier` is candid: `// Placeholder always
returns true (NOT SECURE)`.

Real Plonky2 circuits do exist, at 1,902 lines, but sit behind a non-default
`zk-plonky2` feature that is off in CI and requires nightly Rust.

`framework/modules/zk` is worse and simpler: **every `verify()` in the module
returns `Ok(true)`**, and every `create()` returns zero commitments and an empty
proof vector. It is 333 lines with no tests. Nothing depends on it, which is the
only reason it has caused no harm.

### 2.4 Blocks are never broadcast

`node/src/service.rs` stores a `swarm_manager` and never uses it again.
`broadcast_block` appears nowhere in `node/`. The node can receive blocks but
never sends any, so the network is single-node by construction regardless of how
many machines are started.

Genesis validators are logged and then explicitly skipped
(`service.rs:169-180`), so only the local validator ever enters the set. And the
runtime and consensus engine open **two separate RocksDB instances**
(`service.rs:143-146`), meaning the state root the runtime computes covers a
different key space from the one consensus would verify.

### 2.5 CGT is defined inconsistently, and the precision is too coarse

Three documents and two code paths disagree:

| Source | Decimals | Distribution | Supply |
| --- | --- | --- | --- |
| `framework/modules/balances` (live) | 2 | none implemented | 13B, cap unenforced |
| `.cursorrules` | 2 | — | 13B |
| `aeons/cgt/pallet` (dead) | 8 | five buckets | 13B |
| `docs/blockchain/CGT_TOKENOMICS.md` | 2 | five buckets | 13B deflationary |
| `docs/specifications/cgt-tokenomics.md` | 2 | Treasury 77% | **inflationary** |
| `modules/agentic/src/sentinel.rs` | 18 | — | — |

The name disagrees too: "Creator God Token" in `.cursorrules`, "Cogito" in the
specification and the SDK.

**Resolution: `.cursorrules` governs.** CGT is the Creator God Token, two
decimals, 13 billion fixed, 100 Sparks to 1 CGT. The launcher implements exactly
this.

**But two decimals is the wrong precision for a traded asset, and this should be
changed before value accrues.** The reasons are concrete:

- `EXISTENTIAL_DEPOSIT` is defined as `CGT / 1000`, which in integer arithmetic
  is **0**. The dust check at `balances.rs:98` is a no-op today.
- The documented transfer fee of 0.001 CGT is not representable. It rounds to
  zero.
- Constant-product market making divides reserves. At two decimals the rounding
  error on a small swap is a large fraction of the trade, which is directly
  exploitable.
- In-game micro-transactions stop being expressible at all if CGT appreciates.

The balance type is already `u128`, which holds the full supply at eighteen
decimals with enormous headroom, so the width costs nothing. Migrating costs a
stored-balance conversion, and that cost only rises from here.

### 2.6 A large amount of well-written code is unreachable

`node` depends on core, storage, consensus, network, modules, rpc and
primitives. It therefore never reaches governance, zk, agentic, qor-identity,
yield-nfts, game-assets or game-registry. These compile and are never executed.

Notable losses in that set:

- `modules/qor-identity` is genuinely good: multi-key, post-quantum ready,
  handle registry, JSON-LD DID export. It is not wired to the node or RPC.
- `modules/governance` implements proposals and voting properly, but
  `execute_proposal` only **returns SCALE-encoded bytes describing what should
  happen** and marks the proposal executed. It applies nothing.
- `consensus/src/modular.rs` and `sharding.rs` are 1,787 lines implementing the
  two headline scalability features. Nothing references either file.
- `modules/game-assets` and `modules/yield-nfts` are 200 lines where every match
  arm is `// TODO` followed by `Ok(())`.

`ModuleRegistry` exists but **is never populated anywhere in the workspace**, so
the module system is decorative; the runtime dispatches to four hardcoded
modules.

There are 205 stub markers across 37 files and **no `todo!()` or
`unimplemented!()` macros anywhere**. The code returns `Ok(())` instead. That is
considerably more dangerous, because a stub that panics is found in testing and a
stub that returns success is found in production.

### 2.7 The client tier is further along than the chain

| Component | State |
| --- | --- |
| `apps/hub` | ~85%. 48 pages, 50+ API routes, ~180 components, real Stripe, Postgres and IPFS integration |
| `apps/wallet-extension` | ~85%. Full MV3 keyring, dApp provider, popup and side panel |
| `services/qor-auth` | Real. Axum, Postgres, Redis, 8 migrations, Argon2id, challenge-response keypair auth |
| `client/DemiurgeClient` | ~35%. 5,234 lines of UE5 C++ across three modules, but zero content assets and the WebSockets plugin is not vendored |
| `tools/qor-launcher` | **0%. One README.** |
| `tools/qor-installer` | **0%. One README, "Coming soon".** |
| `tools/spline-mcp-server` | **0%. Empty directory.** |

Three security notes on the client tier:

1. `services/qor-auth` sets `allow_origin(Any)` globally, **including over the
   God-level admin API**.
2. `auth_service.rs:161-165` generates security tokens as
   `Sha256(uuid_v4 || unix_seconds)` truncated to 32 hex characters, rather than
   drawing from a CSPRNG.
3. The browser extension's key derivation is not BIP-32 or SLIP-0010. It
   documents `m/44'/369'/0'/0/index` in a comment and computes
   `sha256(seed || "Demiurge:" + index)`. **Keys created there are recoverable by
   that one extension build and nothing else** — no hardware wallet, no recovery
   tool, no other client. This needs a migration path before anyone stores value
   in it.

### 2.8 Branding does not exist

Exactly one real brand asset survived the repository import: a 474-byte
placeholder SVG in the wallet extension, a letter "D" set in Arial Bold.

All 26 other binaries — every wallet icon, all eleven hub badges, the Unreal
plugin descriptor — are **dead Git LFS pointers**, 128 to 132 bytes each, whose
backing objects were never present. `MISSING_ASSETS.md` documents this honestly.

Three applications also ship three incompatible visual languages: the hub's
ember-on-carbon "Architect", Sophia's purple and cyan, and the portal's Marcellus
serif. `packages/ui-shared` is styled in a fourth, older neon-cyan idiom and
contains four components.

### 2.9 The energy system rejected every transaction

This one was invisible to a source audit and only appeared when a transfer was
actually submitted to a running validator. It is worth recording as a method
note as much as a finding: reading the code was not enough.

With submission newly registered, the first live transfer was accepted into the
pool, drained by the block producer, and then failed with:

```
Transaction execution failed: ModuleError("Energy error: Insufficient energy")
```

The chain of causation:

1. `EnergyModule::regenerate_energy` computes elapsed blocks as
   `current_block - last_update`.
2. `current_block` is read from `System:BlockNumber` in **runtime** storage.
3. `Runtime::execute_block` writes that key, but a block *producer* assembles a
   block by calling `execute_transaction` directly and never goes through
   `execute_block`.
4. `ConsensusEngine::store_block` does write the key, but into the **consensus**
   database, which is a different RocksDB instance (§2.4).
5. So the runtime's copy stayed at `0` forever, `0 <= 0` meant no regeneration,
   every account sat at zero energy, and the base transaction cost of 100 could
   never be met.

**Every transaction on a block-producing node failed, unconditionally.** The
failure was logged at `debug!` and the producer continued, so a node under
default logging looked perfectly healthy while silently discarding every
transaction it was given.

Fixed by adding `Runtime::begin_block`, which sets the height and persists it to
runtime storage, called from the block production loop before execution. This is
a targeted fix, not a cure: the underlying dual-database split is still there and
remains item 4.

Two lessons worth keeping:

- **A split state store will keep producing bugs like this**, each one looking
  unrelated to the last. Item 4 should be brought forward.
- **Swallowing execution errors at `debug!` hid a total failure.** A transaction
  that a producer accepted and could not execute should be reported at `warn!`
  with its hash.

### 2.10 The auth service did not compile

Reading `services/qor-auth` suggested a solid, real service: Axum, Postgres,
Redis, eight migrations, Argon2id, challenge-response keypair login. Building it
told a different story. It failed with 57 errors, and running it surfaced two
more defects that no build could have caught.

**It did not build at all.** Two causes:

- The crate is `edition = "2024"`, in which `gen` became a reserved keyword, so
  four calls to `rand::thread_rng().gen()` were parse errors.
- Every remaining error came from `src/handlers/music.rs`, which was written
  against things that do not exist: six queries select `users.qor_id`, a column
  no migration creates; it calls `AppError::internal/unauthorized/not_found/
  forbidden`, none of which are variants of that enum; it imports a `Claims`
  type from a module that does not define one; and it treats nullable columns as
  non-null.

Because Rust builds the whole binary, that one unused module made **the entire
auth service unbuildable** — registration, login, keypair auth, profile and
agents included. It is now disabled at the module declaration so the service
builds, with the reasons recorded in `src/handlers/mod.rs`.

**Password registration had never worked.** `register` builds
`0x` + a 64-character SHA-256 hash and stored it in `on_chain_address`, declared
`VARCHAR(64)`. 66 characters into a 64-character column: Postgres rejects it with
SQLSTATE 22001 and the request fails with a 500. Every password registration on
every deployment failed.

**Keypair registration stored an address that cannot receive funds.** It dodged
the same length error by storing `0x` + only the first 40 characters of the
public key, an Ethereum-style 20-byte truncation. On Demiurge the account ID
*is* the full 32-byte Ed25519 public key, so that value is not an account: it
cannot be verified against a signature and CGT sent to it is unreachable. It fit
the column, which is the only reason it looked like it worked.

Migration `009_fix_on_chain_address.sql` widens the column to 66, rebuilds
truncated addresses from the stored public key where one exists, nulls the rest
rather than leaving plausible-looking dead addresses, and adds a CHECK
constraint so a malformed address cannot be written again.

**A consequence worth noting.** `register` used to mint starter CGT by calling
`balances_claimStarter` unauthenticated. Now that the faucet requires a
signature, the auth service can no longer mint on a user's behalf, and new
accounts report `starter_cgt_minted: false`. That is the correct outcome: an
identity server should not be able to create money. The claim belongs in the
launcher, which holds the user's key and can sign for it. That is outstanding
work.

---

## 3. The realignment

### 3.1 The launcher is the platform

Everything routes through the QOR Launcher. Not as a rule imposed on the
architecture, but because it is the only place where the pieces can actually be
made to fit:

- **Custody belongs in a native process.** Keys in a webview share an address
  space with page script. Keys in a Rust host do not. The launcher can sign and
  refuse to export.
- **Peer-to-peer distribution is not a browser capability.** Seeding content
  needs a long-lived process, disk and sockets.
- **A game launcher is a supervisor.** Installing, patching and launching titles
  with short-lived session keys requires process control.
- **One identity, one session, one wallet.** The current arrangement has a web
  hub, a browser extension, a standalone portal and a CLI, each with its own
  session handling. That is four attack surfaces for one user.

`.cursorrules` already designates the launcher as "The Hub", and the design
system document names continuity from installer to launcher to in-game as its
first pillar. This realignment makes that real.

### 3.2 What was built in Phase 1

`tools/qor-launcher` — a Tauri 2 desktop application, Rust host plus a React 19
and Vite frontend. Delivered and building:

**Rust host (50 passing tests)**

- **Vault.** BIP-39 24-word phrases; **SLIP-0010 Ed25519 hardened derivation** at
  `m/44'/369'/account'/0'/index'`, verified against the specification's own test
  vector. This is the standard scheme, and it deliberately fixes the extension's
  bespoke derivation.
- **At-rest encryption.** Argon2id at 64 MiB and 3 passes, then
  XChaCha20-Poly1305. **The header is the AEAD associated data**, so the KDF
  parameters and salt are authenticated and an attacker cannot downgrade the work
  factor to make cracking cheaper. There is a test for exactly that.
- **Key handling.** Zeroize throughout, a redacting `Debug` on the decrypted
  phrase so it cannot leak into a log or a panic message, idle auto-lock, and an
  atomic write-and-fsync so a crash cannot truncate a vault.
- **Chain client.** A faithful port of the node's canonical signing payload, with
  tests pinning the exact byte layout and the `balances_transfer` field order.
- **Identity client.** Password and challenge-response keypair sign-in against
  `services/qor-auth`, with tokens in the **OS keychain**, never in the webview.
- **Denomination.** All amounts are integer Sparks in `u128`. Excess precision is
  rejected rather than silently truncated, because quietly dropping value from a
  payment is the worst failure a wallet can have.

**Frontend**

- Frameless window with custom chrome, the chain indicator and the auto-lock
  countdown always visible.
- The Gate: vault creation with phrase transcription and spot-check verification,
  unlock, key-based and password sign-in, and QOR ID claiming with debounced
  availability checking.
- Vault, Chain and Settings surfaces are functional. Send is a two-stage compose
  and confirm, and **the amount is parsed by the Rust host**, so the number the
  user confirms is the number that gets signed.
- Library, Agora and Mesh state their scope and their blockers rather than
  showing mock content.
- One design system, continuing the hub's Architect palette, with a single glass
  idiom and no runtime web-font dependency.

### 3.3 Ordered work, and why this order

**Before anything else, make the chain honest.** Every later item depends on it,
and none of it is exotic work.

1. ~~**Route economic RPC through the transaction pool.**~~ **Done.**
   `chain_submitTransaction` and `author_submitExtrinsic` are registered, along
   with mempool inspection. A signed transfer now travels pool → runtime →
   block, verified live: 2,500 Sparks settled in block #24 with the sender
   debited and the recipient credited. Covered by 7 tests in
   `rpc/tests/submit_transaction_test.rs`, plus a signing reference at
   `rpc/examples/sign_transfer.rs`.
   *Remaining:* `balances_transfer` still writes storage directly. It is now
   redundant, since clients can submit a real transaction instead, and should be
   turned into a thin wrapper over the pool or removed.
2. ~~**Authenticate `drc369_mint`; remove or rate-limit `balances_claimStarter`.**~~
   **Done.** Minting requires an Ed25519 signature bound to the minter's nonce,
   and an ordinary account may only mint to itself; minting to a third party
   requires the Godmode key. The creator is now recorded as the minter rather
   than the owner, so royalties follow the author. The faucet is signed, and off
   unless the operator passes `--faucet`.
3. ~~**Enforce the supply cap.**~~ **Done.** `credit_total_supply` gates every
   issuance path and refuses anything that would exceed 13 billion CGT, Godmode
   included. The cap is the one property no key should be able to override.
4. **Merge the two RocksDB instances** so the state root means something. This
   should be brought forward: it has already produced one total outage (§2.9)
   and will keep producing bugs that look unrelated to each other.
5. **Broadcast produced blocks** and register genesis validators, so more than
   one node is possible. This is now the top blocker.
6. ~~**Redenominate CGT.**~~ **Done.** Now 18 decimals, defined once in
   `framework/primitives/src/denomination.rs` and read by every crate. The
   existential deposit is a real number for the first time, the documented
   0.001 CGT fee is representable, and amounts down to 10^-18 CGT settle in
   blocks. Verified live. `.cursorrules` was updated to match, since it stated
   the old precision as project law.
7. **Delete `modules/zk`** rather than shipping a module where every verifier
   returns true. Either enable the real Plonky2 path by default or stop claiming
   zero-knowledge in the README.
8. ~~**Correct the README.**~~ **Done.** The 100% completion table is replaced
   with per-area status, and the claim that a self-defending system makes audits
   perpetually valid is removed.
9. **Report swallowed execution failures at `warn!` with the transaction hash.**
   A producer that accepts a transaction and cannot execute it currently logs at
   `debug!` and moves on, which is how §2.9 stayed invisible.

Then the platform work, in dependency order:

10. **Content addressing on chain.** A manifest hash per title and per patch. The
   Mesh cannot verify a download without a trusted root, and the Library cannot
   patch safely without one.
11. **Library.** Install, delta patch and launch, with entitlements read from
    DRC-369 holdings.
12. **Session keys wired into transaction execution.** The module works; the
    transaction type has no field for one, so nothing ever checks it. This is
    what lets gameplay avoid wallet prompts.
13. **Agora.** Bring the existing VYB rooms, direct messages and streaming into
    the launcher over a persistent socket, and back identity with the handle
    registry.
14. **Mesh.** Torrent-style swarms verified against on-chain manifests, with
    seeder rewards settled in CGT, which item 1 has now unblocked.
15. **QOR Installer**, sharing the launcher's Rust core.

### 3.4 What CGT needs to be money

Stated separately because it is the request most at odds with the current code.

| Requirement | State | What it needs |
| --- | --- | --- |
| Transfers in blocks | **Absent** | Item 1 |
| Auditable history | **Absent** | Follows from item 1 |
| Enforced supply cap | **Absent** | Items 2 and 3 |
| More than one validator | **Absent** | Item 5 |
| Exchange-grade precision | **Insufficient** | Item 6 |
| Secure custody | **Delivered** | The launcher vault |
| Signed, replay-proof transfers | **Delivered** | Already sound on chain |
| Order book or AMM | **Absent** | No DEX, AMM or bridge code exists anywhere |
| Fee and burn mechanics | **Documented only** | Not representable at 2 decimals |

Items 1 through 6 are the prerequisite for any listing conversation. None of them
is research; all of them are wiring that the codebase already has the parts for.

---

## 4. Decisions taken

- **Tauri 2 over Electron.** A Rust host shares a language and a crypto stack
  with the chain, produces a binary in the single-digit megabytes rather than
  over a hundred, and keeps key material out of the JavaScript heap.
- **Vite over Next.js for the launcher.** It is a desktop single-page app. There
  is no server, no SSR and no SEO surface, so Next.js would add a static-export
  step for nothing.
- **SLIP-0010 over the extension's scheme.** Portability and recoverability are
  not optional for a wallet.
- **XChaCha20-Poly1305 over AES-GCM.** A 192-bit nonce can be drawn at random
  with no collision concern, removing the nonce-reuse failure mode.
- **Argon2id over PBKDF2.** Memory-hardness is what costs a GPU attacker.
- **`.cursorrules` as the tie-breaker** wherever the documentation contradicts
  itself.
- **System fonts, not web fonts.** A launcher must render correctly offline and
  on first run. Bundling the real faces locally is a worthwhile follow-up.
- **Blueprint screens instead of mock UI** for surfaces that are not built.

---

## 5. Corrections owed to the README

The root `README.md` should be amended. It currently states:

- "Feature Completion: **100%**" — not supportable.
- "Token Economics: ✅ 100%" — transfers do not enter blocks and the supply cap
  is unenforced.
- "NFT Standard: ✅ 100% ... backend 100% complete" — the mint endpoint is
  unauthenticated.
- "Agentic Layer: ✅ 100%" — the module is not reachable from the node binary.
- "Advanced Consensus: ✅ 100% — Modular Fluidity, Elastic Sharding" — 1,787
  lines that nothing references.
- "Security Audits: Self-defending system makes audits perpetually valid" — this
  should be removed. No property of a system makes an audit perpetually valid,
  and the mechanism it refers to is currently unsound.

The README already contains a status note acknowledging some of this. The
honest fix is to let that note replace the claims above it.
