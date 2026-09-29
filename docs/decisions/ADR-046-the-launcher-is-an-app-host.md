# ADR-046: The launcher hosts products as separate OS processes it spawns, supervises and signs for

**Status:** **Accepted**, 28 September 2026, by the project owner. Proposed 21 September 2026.

**Depends on:** [ADR-001](ADR-001-innovation-budget.md) (build boring where failure is silent),
[ADR-016](ADR-016-sign-in-with-unlock.md) (the arrival grant and its limits),
[ADR-040](ADR-040-the-launchers-chain-client-is-subxt.md) (the host builds the bytes it signs, from the node's own
metadata), [ADR-026](ADR-026-agent-delegation-with-pallet-proxy.md) (delegation is a chain mechanism, not a local
allow-list). **Relates to:** [ADR-043](ADR-043-qor-id-as-an-identity-provider.md) §3, Proposed, which this record
needs and does not supply.

## Context

The launcher is one Tauri 2 window, label `main` (`tools/qor-launcher/src-tauri/tauri.conf.json`, `app.windows[]`),
with no child processes except the release-gate suites. Everything Demiurge means to ship above it — QOR Engine,
Qontrol, QFX, Studio, the Library's titles — is a separate program needing identity, assets, versioning and
settlement without ever touching a key. Four facts in this tree force the decision rather than invite it.

1. **The Core process is the vault.** Tauri is multi-process, but the split is webview-versus-core, and the vault,
   chain client and keychain handles all live in Core. `src-tauri/Cargo.toml:104` sets `panic = "abort"`, so one
   panic in one product's handler would end the signing session for everything open. What must not die and what is
   allowed to die cannot share a process.
2. **The host already spawns and supervises external processes**, at `src-tauri/src/gates.rs:1286-1287`
   (`tokio::process::Command`, `kill_on_drop(true)`) and `:1386-1388` (`CREATE_NO_WINDOW`). The pattern exists;
   nothing generalises it.
3. **There is no generic `sign(bytes)` anywhere.** `src-tauri/src/lib.rs:881` lists every command the webview may
   call, and none is `vault_sign`. Each typed call builds its own bytes (`src/chain/mod.rs:369-374`) and its own
   prompt before reaching `Vault::sign` (`src/vault/mod.rs:252`), and free-form signatures are domain-tagged
   (`src/identity/mod.rs:44`). A local SDK exposing `sign(bytes)` would give a third party the one thing the first
   party never had.
4. **The launcher has no single-instance guard.** Two launchers means two vaults, two servers on one name and a
   collision — a prerequisite, not a polish item.

The context above was measured before two commits landed on 21 September 2026, and they change what this record
hosts rather than how. Qontrol's Projects surface and its staging sidecar are committed (`5a44207`): `gix = "0.87"`
at `src-tauri/Cargo.toml:35`, the host module at `src-tauri/src/qontrol/`, and the separate crate at
`tools/qor-launcher/qontrol-git/`. QFX layer one is committed (`75b2ead`): `src/qfx/`, a WebGL2 backdrop and the
chrome's contrast guarantee. **Both are launcher surfaces, not hosted products** — neither is spawned, neither
speaks a protocol, and the sidecar is a one-shot child process for staging, not a product process. They are
evidence for decision 1 rather than instances of it: the sidecar exists precisely because libgit2 must not link
into the process holding the vault, which is this record's argument in miniature. Neither has a defining record,
and neither name is in `docs/SYSTEMS.md:79-91`'s "named by you, undefined" table, which lists QOR Engine but not
these two. Distribution (`docs/DIRECTION.md:486-490`), entitlements and the Mesh (`:392-398`,
`:492-498`) are unstarted. This record decides the host's shape; it does not pretend those exist.

## Decision

1. **A product is a separate OS process, spawned and supervised by the launcher host, owning its own top-level
   window.** Not a Tauri window, not a webview, not necessarily Tauri; it may be written in any language and own its
   own GPU device. The launcher supervises but does not restart in a loop: on exit it records the exit code, a tail
   of stderr and a crash id, shows them, and relaunches at most once unasked. It takes a single-instance lock before
   opening a server or a vault; a second invocation raises the first window and exits.

2. **Process lifetime is enforced per platform, portable path first.** Windows: a Job Object with
   `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. Linux: `PR_SET_PDEATHSIG` in the child. macOS has no equivalent, so **every
   product must exit when its control channel closes**, built and tested before either platform-specific path.

3. **The transport is a named pipe on Windows and a Unix domain socket on macOS and Linux, behind one Rust
   abstraction** that keeps the raw platform handle reachable, because decision 5 needs it. **Frames are a 4-byte
   big-endian length prefix and a UTF-8 JSON object, capped at 1 MiB**; anything larger closes the connection, and
   the host never allocates from a length the peer supplied. **Bulk data never crosses it**: asset bytes, frame
   buffers and installer payloads move by a path, an inherited handle or shared memory that a control frame names.

4. **The handshake negotiates one integer major version and a capability set.** The product opens with `protocol`,
   `min_protocol`, its id, its version and its spawn token; the launcher answers with the major it chose, the
   capabilities it will honour, and a session id. Within a major, changes are additive only: unknown fields ignored,
   new methods announced as capabilities, an unknown method a typed `unsupported_method` error. One schema file
   lives in the repository, with a golden-frame corpus every release adds to and the suite replays.

5. **The launcher trusts only processes it spawned, proved two ways at once.** **A one-time spawn token** of 32
   random bytes goes to the child's **stdin pipe**, which is then closed — never argv (`/proc/*/cmdline`, Task
   Manager), never an environment variable (`/proc/<pid>/environ`); it names one product id, one launch and one
   connection, expires in seconds and burns on first use. **OS peer credentials** are checked against the process
   the launcher spawned: `SO_PEERCRED` with `SO_PEERPIDFD` where the kernel has it, `LOCAL_PEERCRED` with
   `LOCAL_PEERTOKEN` on macOS, `GetNamedPipeClientProcessId` plus the client token's user SID on Windows, with the
   child's `(pid, creation time)` pinned at spawn so a recycled pid cannot pass. **A transport ACL comes first
   because it is cheapest**: `FILE_FLAG_FIRST_PIPE_INSTANCE` and a DACL granting only the current user's SID; on
   Unix a `0600` socket in a `0700` directory the launcher owns. The FFI lives in its own crate, since
   `src-tauri/Cargo.toml:15` sets `unsafe_code = "forbid"`, which `#[allow]` cannot override. There is no attach
   mode: a product that must outlive the launcher reconnects with a refresh token from the original spawned session,
   so every connection stays rooted in a spawn.

6. **Code-signature verification is an install-time control, not a runtime one.** `WinVerifyTrust` and
   `SecCodeCheckValidity` against a designated requirement run at install and before spawn; Linux has no equivalent,
   so the launcher records each binary's SHA-256 at install and refuses to spawn one whose hash changed. **This is
   not a sandbox**: a same-user process injecting into an installed product inherits its pid, path and signer, so
   malware running as the user is past every control here — and the threat model says so in those words.

7. **A product never supplies bytes to be signed. It supplies a typed intent**, and the launcher builds the bytes,
   renders them to the human and signs them. Three classes exist and nothing else. A **chain intent** is a named,
   schema'd call with named arguments, never SCALE bytes: the launcher builds the extrinsic from the connected
   node's metadata (ADR-040), decodes it back, shows pallet, call and every argument, and signs `signer_payload()`.
   An **identity** request is refused outright — QOR ID challenges stay behind `demiurge:qor-id:challenge:v1:`
   (`src/identity/mod.rs:44`) and the launcher's own session. A **product statement** is the exact sentence shown,
   signed under a distinct `demiurge:product:<id>:v1:` tag over it and a hash of its context, so it is neither a
   valid extrinsic nor a valid challenge. **What is signed is a function of what is displayed**, so the two cannot
   differ; anything fitting none of these is a protocol change.

8. **The dialog is the host's, and it names who is asking.** `HostDialog` (`src/lib.rs:70`) gains the product's
   display name and installed id from the launcher's own install record rather than from the connection, the
   statement or decoded call verbatim, and the endpoint; endpoint changes stay behind `confirm_endpoint_changes`
   (`src/lib.rs:144`). Products run borderless-fullscreen-windowed and **exclusive fullscreen is banned**, so a host
   dialog can appear above one and take input, the product first calling `AllowSetForegroundWindow` with the
   launcher's pid on Windows. **The passphrase is typed only at the Gate**, never in a dialog raised in answer to a
   product: a product can paint a convincing fake, and all a fake can harvest is what the user types into it.

9. **ADR-016's arrival grant never covers a product request.** It is scoped to one account and to QOR ID challenges,
   and closes on session, lock or five minutes (`src/lib.rs:178`, `:188`). One intent, one approval. A product
   wanting to spend repeatedly without asking is describing agent rails — a delegated key with caps enforced by the
   chain (ADR-026, M5.2) — which does not exist yet.

10. **Nothing secret reaches a log.** The spawn token, the session id and every signature join the launcher's own
    runtime log check in the change that lands this flow, under the rule AGENTS.md §9 states for QOR ID. The
    launcher has no such check today; this work adds one.

11. **First obligation of this record, discharged rather than owed: Qontrol's libgit2 half runs as a sidecar
    process.** Qontrol is gitoxide for every read path — status, log, diff, branches — and libgit2 for stage and
    write-tree only, both behind Qontrol's own interface, reversible the day gitoxide's `tree from index` lands.
    **The sidecar was built; the temporary link was not taken**, and the budget rule said to say plainly which:
    `tools/qor-launcher/qontrol-git/`, one crate, `git2 0.21` with
    `default-features = false, features = ["vendored-libgit2"]` so no system library substitutes itself and no
    OpenSSL or libssh2 is linked, `unsafe_code = "forbid"`, and exactly the two operations plus a ping. It holds no
    keys and never links into the process holding the vault, because Qontrol opens folders the user picks and later
    repositories from strangers, and libgit2's parser history is not what the vault's process should parse. It exits
    0 when stdin closes — decision 2's portable rule, already satisfied. **Two deviations, stated rather than
    hidden**: its transport is line-delimited JSON on stdio rather than decision 3's frames, because the messages
    are tiny and a transcript has to stay readable when it misbehaves, and it converges on decision 3 when it moves
    to the control channel; and it is to ship bundled via Tauri `externalBin` — not the mechanism for products,
    since that bakes a target-triple binary into the installer while products update separately, but right for a
    bundled helper. **It is not bundled yet:** `tauri.conf.json` has no `externalBin` entry, so the host finds the
    helper through `QONTROL_GIT_BIN` or a development build (`src-tauri/src/qontrol/sidecar.rs:25-71`), and an
    installed launcher could not commit.

12. **That split is pinned by two tests, each proven to fail first**, because a test written after the fix proves
    nothing about the failure it claims to catch. **The tree does not lie**: after a commit through the split path,
    gitoxide's status reports clean and, where git is installed, `git status --porcelain` reports clean — pinning
    the failure the split exists to prevent, where a commit that bypassed the index leaves objects and refs right
    and the working state lying, silent and delayed, in ADR-001's column. **Ignore agreement, both directions**:
    against a fixture `.gitignore`, a file untracked in gitoxide's status is also skipped by libgit2's add, and a
    file libgit2 stages is not reported untracked by gitoxide. Both honour the repository's config and
    `.gitattributes` as git would, `core.autocrlf` and case included; on Windows that is the difference between a
    clean tree and one that lies. All three exist in `src-tauri/src/qontrol/tests.rs` —
    `after_a_commit_the_working_tree_is_clean`, `git_itself_agrees_the_tree_is_clean` and
    `the_two_ignore_implementations_agree` — each proven to fail first in `5a44207`. The weakness is theirs, not
    the design's: each returns early, and passes, when the helper is not built, so a run that never built it
    proves nothing.

## Consequences

**What it costs.** The local server, framing and handshake is roughly two weeks; the spawn-proof crate across three
platforms roughly three; spawn tokens, Job Objects, `PR_SET_PDEATHSIG`, single instance and foreground handoff
roughly three more. A local SDK v1 — schema, Rust client, golden-frame corpus, three intent classes — is a
three-month deliverable for one founder with an agent, needing no chain milestone. Code-signature verification waits
on L6.1 for signing identities; install, patching, entitlement and launch need M4, M8.1, M8.2 and L6, which is chain
work.

**What it makes possible, and what it forecloses.** A product can crash, hang, leak or be killed without touching
the signing session, and can be written in any language and take a raw GPU device — and with it comes the property
that makes the platform defensible: **a product can be paid, and can pay, without ever holding a key.** In exchange,
no product ever gets `sign(bytes)`, no "trusted product" list substitutes for the spawn proof, and no allow-list
stands in for on-chain delegation. **Nothing economic is decided or implied here**: no issuance rate, genesis split,
fee class or burn share, and OPEN-1, OPEN-2 and OPEN-4 stay open. This record also has no L-number — adding one is
the owner's edit to `docs/DIRECTION.md`, not a second roadmap.

**Alternatives rejected.**

- **Tauri multi-window or multiwebview in the launcher process.** A host panic, an OOM or a bad dependency on any
  product's path kills the vault with `panic = "abort"` set (`src-tauri/Cargo.toml:104`), and webview-only means no
  raw device; multiwebview is also explicitly unstable and desktop-only. Rejected: ADR-001 puts the shell's process
  boundary in the "failure is silent and permanent" column.
- **Linking libgit2 into the launcher host, dated, expiring on decision 1.** The cheaper option, costed rather than
  dismissed: it saves one crate and two commands. Rejected because the saving is that small and the exposure is not:
  the host holds the vault, Qontrol's input is folders the user picks and later repositories from strangers, and a
  dated exemption inside a security boundary outlives its date.
- **gitoxide alone, no libgit2.** Its own `crate-status.md`, checked 21 September 2026 against `gix` 0.87.1, marks
  `add files with .gitignore handling`, `tree from index` and `add and remove entries` unimplemented while marking
  status, rev-walk, diff and `create new commit from tree` done: the gap is staging, not push or rebase. Rejected —
  a Projects surface that reads but cannot commit is not worth opening.
- **libgit2 alone, or reimplementing staging on gitoxide's index primitives.** libgit2 alone puts a C parser on
  every read path, including walks over thousands of files in a folder the user just picked. Reimplementing staging
  means a second implementation of `.gitignore`, `.gitattributes`, `core.autocrlf` and case handling — the
  divergence decision 12's second test exists to catch. Both rejected.
- **AF_UNIX on Windows, or localhost TCP.** AF_UNIX carries no peer credentials and Rust `std` support is still
  unstable, so uniformity would cost the whole Windows half of decision 5; TCP is slowest, reachable by any process
  in any session, prompts the firewall, and is the only option a remote box could reach.
- **stdio as the main channel, `Content-Length` headers, or msgpack, CBOR, protobuf or Cap'n Proto.** stdio stays
  the spawn-token bootstrap and decision 11's transport, but as the main channel it cannot reconnect after a
  re-exec, is inherited by grandchildren, and multiplexing it reinvents a socket. The header block adds a CRLF state
  machine and a second length source that can disagree with the body, for no property a fixed prefix lacks. The
  codecs buy schema discipline at the cost of a codegen toolchain in every language a product might use, and the
  control plane carries intents, never bulk.
- **Connect-time signature checks.** The launcher already knows which pid it spawned, so verifying at connect adds
  almost nothing over install and pre-spawn. Attach mode is rejected in decision 5 for discarding the spawn token,
  the only layer that is cheap, sound and cross-platform.
- **Session-wide signing approval for a "trusted" product.** The blind-signature problem with a friendlier name; the
  honest version is on-chain delegation with enforced caps (ADR-026). Not to be proposed again before M5.2 exists.

**Substrate gaps this design runs into, recorded and not filled locally.**

| Gap | Where it bites | Closed by |
| --- | --- | --- |
| No asset format. DRC-369 is M4 and unstarted; the wire format is M2.3 | A shared asset library can hold files and hashes and nothing more | M2.3, then M4 |
| No entitlements | The launcher cannot answer "does this person own this product" with any authority | M8.2 |
| No per-client identity in QOR ID | "Revoke this product's access" is inexpressible; every product shares one session and one switch. ADR-043 §3 is **Proposed, not accepted** | ADR-043 |
| No fees, pending OPEN-4 | A product cannot settle anything that costs a fee. Transfers work | M6.4 |
| No Mesh | Product download, patching and seeding have no rail | M8.1 |
| No signed installers or update channel | Decision 6 has nothing to verify against until signing identities exist | L6.1–L6.3 |
| Qontrol has code but no record; QFX has neither | Two products this record hosts are absent even from `docs/SYSTEMS.md:79-91`, which lists QOR Engine but not these | Their own ADRs |
