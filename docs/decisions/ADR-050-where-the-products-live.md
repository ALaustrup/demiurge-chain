# ADR-050: Where each product lives, and a release gate of its own for each

**Status:** **Accepted**, 28 September 2026, by the project owner. Proposed 21 September 2026.

## Context

The repository has three active directories — `chain/`, `services/qor-auth/` and `tools/qor-launcher/`
(`AGENTS.md:43`) — and a frozen set defined by path: everything under `apps/`, `cli/`, `sdk/`, `packages/`
and `client/` (`AGENTS.md:43-45`, `docs/DIRECTION.md:512-516`). `tools/qor-installer/` is active "when M8
reaches it" (`docs/DIRECTION.md:507`), the only precedent for a directory scoped before it exists.

The products now being designed have no address at all. `docs/SYSTEMS.md:86` lists QOR Engine as **named
only** — "a subdomain is reserved and nothing else"; Qontrol, GNOSIS and QFX are a step behind, found by a
case-insensitive grep only in frozen lore (`apps/hub`, `apps/sophia`), in build artefacts under `client/`,
in four deploy scripts where "Gnosis" is a Windows account name in an SSH path. Stream is a placeholder from
research; the word appears nowhere in `docs/`. Yet one product already has code with nowhere of its own to put
it: the libgit2 staging sidecar at `tools/qor-launcher/qontrol-git/`, deliberately outside the host that holds
the vault. It was untracked while this record was drafted and was committed the same day (`5a44207`) **inside
the launcher**, because a surface of the launcher is what it is today. That is the decision this record would
have been asked for, taken by default — which is the argument for taking it deliberately now, before the
second product does the same thing.

`docs/GATES.toml` is the other half: it defines Alpha, Beta and Public Release and nothing else, and the
launcher computes progress from it and from nothing else (`GATES.toml:3-5`). Three properties of that
machinery, read in the code rather than assumed, bound what can be proposed here. The host is generic over
the gate list — one report per `[[gates]]` entry (`tools/qor-launcher/src-tauri/src/gates.rs:308`), its
own test asserting one report per gate (`:1803`) — so **adding gates needs no launcher change**. A
`kind = "gate"` criterion resolves against **earlier gates only**, a later one reporting "no earlier gate
has this id" (`:642-653`), which makes file order a mechanical constraint. And a `tests` criterion over a
suite with an empty `dir`, or one never run, is **unmeasurable** (`:423-433`; `GATES.toml:328-332`) —
`[suites.chain] dir = "chain"` was written before `chain/` existed for that reason, recorded as changing
no unit's state (`GATES.toml:196-199`).

What forces the decision now: six products are being specified in one batch of records. If each invents
its own home and its own definition of done, the result is a second roadmap and a second status table,
which `AGENTS.md` §3 forbids — or product work counted inside the chain's gates, where a slipping engine
would make Alpha look further away than it is.

## Decision

1. **Products live under a new top-level `products/`, one directory per product, each its own Cargo
   workspace**, as `chain/` is (`chain/Cargo.toml:10-12`). None is created under `apps/`, `cli/`, `sdk/`,
   `packages/` or `client/`: those paths are frozen wholesale, and a live directory blurs D-011's boundary.

2. **Shared rails live under a new top-level `platform/`**, not inside any product and not inside the
   launcher. Two crates are known from the app-host research: `platform/qor-host-protocol` (the frame
   schema, both halves of the local SDK, the golden-frame corpus) and `platform/qor-peer` (peer credentials
   on three platforms). `qor-peer` cannot live in the launcher crate, which sets `unsafe_code = "forbid"`
   (`src-tauri/Cargo.toml:15`) where `#[allow]` cannot override it, while every peer-credential call is
   `unsafe` FFI; nor can `qor-host-protocol`, since products depend on its client half.

3. **A directory under `products/` means the artefact is installed and updated separately from the
   launcher.** Anything bundled inside the launcher's own installer stays under `tools/qor-launcher/`,
   however product-shaped — so `tools/qor-launcher/qontrol-git/` is the staging sidecar's right address
   **today**, bundled in that installer as a Tauri sidecar. It moves to `products/qontrol/` the day Qontrol
   is installed and updated separately, the app-host record's first obligation. The move is the trigger.

4. **Names.** A product directory is the product's name in lower-case kebab (`qontrol`, `qor-engine`,
   `gnosis`, `qfx`) and every crate inside carries that prefix (`qontrol-git`, `qfx-core`), so one grep
   finds all of a product. Publishing a crate or naming a pallet still needs the owner (`AGENTS.md` §8).

5. **Per-product layout, where the shape is settled.** `products/qor-engine/` holds the build recipe pinning
   an upstream Godot tag, QOR's modules, the editor plugins (QOR ID sign-in, the DRC-369 asset library,
   Qontrol, publish to Market, QFX, agent rails) and the branding. **Upstream Godot is fetched at build
   time and never vendored here**; an unavoidable patch is one file in `products/qor-engine/patches/`
   naming its reason and upstream change, so "tracking upstream, never a hard fork" is countable rather
   than intended. The distribution carries **"QOR Engine, built on Godot"**, verbatim, and a test pins that
   string and the MIT attribution. `products/qfx/` holds the format, its reference implementation and its
   conformance corpus, and **no renderer**: the shell's stays in `tools/qor-launcher/`, the engine's is a
   module in `products/qor-engine/`, layer three's scene editor is an editor plugin in the custom build,
   and `products/gnosis/` holds the music product: text, diffable, mergeable, `.tscn` as the precedent.

6. **Market, Library and Stream get no product directory.** Library's and Market's code is the launcher's
   own surfaces, L7.1 and L7.2, and Stream has no code and no record. They get a gate each like the other
   four, which is the owner's instruction for this work, and this record's draft argued against it before
   being revised: Library is L7.1 and Market L7.2, both already counted — with M8.2, entitlements for the
   Library, and M8.3, the staking-for-distribution sink for Market — by `public-release.platform`
   (`GATES.toml:737-740`). Counting them in Market's gate as well costs a unit in each total and nothing
   else: two criteria reading one checkbox cannot disagree about it.

7. **One gate per product in `docs/GATES.toml`, appended after Public Release**, built only from kinds that
   read the tree — `adr`, `roadmap`, `open_question`, `tests` — with **at most one `check` unit per gate**, and
   only where no signal can compute the answer. A product with code has a suite that runs it; a product
   without a directory gets a suite whose `dir` stays `""` until `products/<name>` exists, so its tests unit
   stays unmeasurable. The template, Qontrol's as worked example:

   ```toml
   [[gates]]
   id = "qontrol"
   name = "Qontrol"

     [[gates.criteria]]
     id = "qontrol.decisions"
     kind = "adr"
     adrs = ["ADR-046", "ADR-048", "ADR-050"]  # a record defining Qontrol itself joins when one exists
     [[gates.criteria]]
     id = "qontrol.roadmap"
     kind = "roadmap"
     items = ["P1.1", "P1.2", "P1.3"]           # its product track in DIRECTION.md
     [[gates.criteria]]
     id = "qontrol.depends"
     kind = "roadmap"
     items = ["M2.3", "M4.1", "M4.2"]           # the chain items its own track names
     [[gates.criteria]]
     id = "qontrol.tests"
     kind = "tests"
     suite = "qontrol"                          # the launcher's code, while the helper ships there (decision 3)
     require = ["after_a_commit_the_working_tree_is_clean",
                "git_itself_agrees_the_tree_is_clean",
                "the_two_ignore_implementations_agree"]
   ```

8. **A product gate may count chain items; a chain gate never counts a product item or names a product
   gate.** A product whose track includes minting DRC-369 or settling CGT counts, by number, the chain and
   launcher items its track depends on: it cannot be finished honestly against a chain with no assets and no
   fees. It counts those items rather than naming a whole chain gate, so a product is not held by a criterion
   it does not need — a name clearance opinion or a published genesis. Appending product gates after the
   chain's keeps `kind = "gate"` from ever pointing the wrong way (`gates.rs:642-653`).

9. **Nothing here changes Alpha, Beta or Public Release.** No unit is added to, removed from or reworded in
   those three; the `GATES.toml` change is append-only plus a `[[change_log]]` entry. It is no loosening
   under `GATES.toml:36-51`: no `met` condition moves, no evidence rule widens, no threshold falls.

10. **A product enters active scope through one change containing five things**, and no other way: the
    record that defines it, accepted; its items in a new product track in `docs/DIRECTION.md` §7 — `P1`,
    `P2`, … one heading per product, items `P1.1` and so on, parallel to the launcher's L-numbers, with
    `GATES.toml`'s naming paragraph (`:52-56`) gaining a sentence saying so; its path in `AGENTS.md` §4 and
    `DIRECTION.md` §8; its gate and suite in `GATES.toml`; and its CI job (`cargo fmt --all --check`,
    `cargo clippy --workspace --all-targets -D warnings`, `cargo test --workspace --locked`) in
    `[ci].quality_gates`, a tightening logged as one. **No frozen path is edited, unfrozen, reused or
    deleted** — a product's address is a new path D-011 never covered — and earlier code stays untracked.

11. **No product carries its own identity, asset format, storage or payment rail.** Every product uses QOR
    ID, DRC-369, Qontrol, the Mesh and CGT; anything missing is a substrate gap, recorded and not filled
    locally. The mechanical half, itself a tightening: the security job's manifest scan fails when a
    manifest under `products/` or `platform/` depends on a private-key crate (`sp-core`, `sp-keyring`,
    `schnorrkel`, `bip39`) — signing belongs to the vault, and a product receives signatures over the
    rails, never keys. Verification-only use is allowed and says so in the manifest.

## Consequences

**What it costs, and what it buys.** Two new top-level directories in a repository whose active list is
three entries long, and each adds a CI job, a lockfile, an audit surface and runner minutes — cost
unknown, because **no job in any workflow here has ever run**: every run fails at startup, and a probe
workflow pushed on 2026-09-21 failed the same way (`docs/DIRECTION.md`, L1.6), so product gates read
`tests` and `roadmap`, not `ci`. In exchange a gate is honest the day it is written: an empty suite `dir` is
unmeasurable, so the dashboard draws no bar (`GATES.toml:27-29`), unticked items are not met, and nothing
counts as met that has not happened — the owner sees each finish line before any product code exists, and
Qontrol's three required tests read the tree. And no product is finished by declaration: the
failure the change log records twice, moved work counted by no gate at all (`:213-217`, `:243-247`),
cannot recur by omission.

**Alternatives rejected.**

- **Products in `apps/`.** `apps/` is frozen by path (`AGENTS.md:43-45`), so a live product there makes "do
  not extend it" unenforceable by grep and leaves the next reader no way to tell which subdirectory is
  maintained. Nothing is gained; a directory name is not a scarce resource.
- **Products in `tools/`.** Rejected as the rule, kept as decision 3's exception. `tools/` holds exactly two
  things today, `qor-launcher` and `spline-mcp-server`; a shipped, separately-updated product is not a
  tool, and once three sit there the word means nothing.
- **Shared rails in the launcher crate, or a generic `crates/`.** `qor-peer` cannot go in the launcher
  crate: `unsafe_code = "forbid"` at `src-tauri/Cargo.toml:15` cannot be locally overridden, and deleting
  it trades a security property for a directory name. `crates/` says nothing about what may depend on what.
- **One Cargo workspace for everything.** The launcher pins `sp-core = "=43.0.0"`
  (`src-tauri/Cargo.toml:52`) under ADR-033 rule 1 and the chain pins the SDK exactly; one resolution
  across an engine build, an audio product and a git client means one product's upgrade moves another's
  lockfile, and `chain/Cargo.toml:1-8` already says why.
- **Vendor Godot's sources into the tree.** It makes a hard fork the path of least resistance — the thing
  the owner already settled against — and buries the one fact that matters, which upstream tag this build
  tracks, in a few hundred thousand files. A pinned tag plus a countable `patches/` keeps it measurable.
- **Count product work inside Alpha, Beta or Public Release.** Those gates mean specific things
  (`GATES.toml:410-413`, `:619-622`, `:716-718`): a slipping product must not make the chain look further
  from mainnet, nor a product be blocked by a mainnet criterion it does not need.
- **One "products" gate covering all of them.** It passes only when the slowest product passes, so it says
  nothing useful for years and hides every product's state behind one aggregate number.
- **No gate for Market and Stream, to avoid counting L7.1 and L7.2 twice.** This record's first draft took
  that position. It lost to the owner's instruction, one gate per product, and on the merits: two criteria
  reading one checkbox cannot disagree, and a Market gate is the only place Market's own steps are counted.
  Stream's gate invents no scope; it counts the blueprint's steps and the one question, U-6, on which the
  listening half depends.
- **A `check` criterion per product ("the owner agrees it is done").** `check` units are asserted, not
  computed (`GATES.toml:31-33`), and a gate made of assertions cannot fail.

**Honest feasibility.** Reused: the whole gate machinery — no launcher change to add gates (`gates.rs:308`,
`:1803`) — and the CI job shape, copied from the existing `chain`, `qor-auth` and `launcher` jobs
(`.github/workflows/ci.yml:53`, `:157`, `:220`). New: two top-level directories, one CI job per product,
the manifest scan in decision 11, and the product track. **In three months**, one founder with an agent
plausibly lands `platform/` with the rails, Qontrol's split path inside the launcher with the four tests
above, and this file's gate skeletons — `products/` itself may still be empty, and that is the honest
outcome, not a failure. **In twelve months**, `products/qor-engine/` with a tracked upstream build in CI, a
build-farm problem before a code problem, and `products/qfx/` with a conformance corpus. **Beyond**:
GNOSIS, and any product whose gate names Beta, which needs M4, the asset primitive, and M6, the economic
mechanisms. **"A gate passing" does not mean** the product is good, that anyone can install it
(the Mesh is M8 and unstarted; signed installers are L6), that entitlements exist (M8.2), or that it can
settle anything costing a fee — the burn share per fee class is **OPEN-4**, fee classes and sponsorship
mechanics **U-4**, the genesis allocation split **OPEN-2**, and no number for any of them appears here or
in any product directory. DRC-369 itself is M4 and unstarted.

## What this record does not decide

- **It defines no product.** QOR Engine, Qontrol, GNOSIS and QFX each need their own record; this one says
  where they live and how their readiness is measured. It names no pallet and publishes no crate —
  `AGENTS.md` §8 keeps that with the owner.
- **It adds no roadmap item and no gate itself.** It decides the form. The product tracks `P1` to `P6` and a
  gate for each were added the same day at the owner's instruction, in this form and ahead of this record's
  acceptance; if the owner rejects the form, they are redone to whatever replaces it. `adrs = []` is never
  written. Having a track and a gate is not being in active scope: decision 10 still governs that.
- **It does not settle whether Stream is a product**, what "Demiurge Exchange" means
  (`docs/SYSTEMS.md:91-101`), or whether QOR Wallet is a second name for Vault (`docs/SYSTEMS.md:89`); it
  changes frozen scope in neither direction; it leaves the host↔product protocol, the trust model and the
  process boundary to the app-host record; and it does not decide CI capacity, since whether an engine
  build needs a self-hosted runner waits on a measurement (`GATES.toml:283`).
- **It invents no economic value**, and no product directory may contain one.
