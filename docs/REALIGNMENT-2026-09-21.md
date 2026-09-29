# Realignment, 21 September 2026

**What this is.** A dated record of what was measured on 21 September 2026, what was found false, and
what was done about it. It is not a roadmap and not a decision log; it points at both.

**Method.** Seven read-only analyses ran in parallel over `chain/`, `services/qor-auth/`,
`tools/qor-launcher/`, the documents and gates, the repository and its security controls, the hosting
plan, and every system the repository names. Each had the same contract: cite `path:line` or a command
and its output, mark anything uncheckable as unverified, and never repeat a documentation claim without
testing it. Where two disagreed, the tree was re-checked by hand. Every finding below that says
"verified" was verified a second time outside the analysis that raised it.

**The rule that governed every correction:** when a document contradicted the code, the document was
wrong. No code was changed to match a document.

---

## 1. What is actually true today

Measured, not inherited.

| | Result | How |
| --- | --- | --- |
| `chain/` | **51 tests pass**, format clean, clippy clean under `-D warnings`, runtime wasm genuinely built | `cargo test --workspace --locked` with no `SKIP_WASM_BUILD`. Proven not skipped: a passing test calls `WASM_BINARY.ok_or_else(…)`, which is `None` when the wasm is skipped |
| Two validators | **13 of 13** | `chain/scripts/check-two-validators.mjs` against a release build. Binary staleness checked by diffing the intervening commits — comment-and-string only |
| `services/qor-auth` | **121 tests pass, 0 failed** | Postgres 16 and Redis 7.4 in containers, all 18 migrations applied, `cargo test --locked -- --include-ignored`. Containers removed afterwards |
| `tools/qor-launcher` | **91 host tests**, plus one ignored without a node. Design 8, accessibility 13, gates-view 34. Frontend builds | `cargo test --locked`; `npm run build`; the three check scripts individually |
| `sudo` | **Off by default** in both the runtime and the node manifests | `[features] default` in each `Cargo.toml` |
| Dependency advisories | **4 of 10 compiled, 6 not** | `cargo tree --workspace -i <crate>@<exact version> --target all`, per version, confirmed with `--all-features` |
| GitHub Actions | **25 runs. 22 synthetic failures, 3 cancelled. Zero have ever reached success or failure** | `gh api …/actions/runs` |

**The chain does what it claims and nothing more.** It produces blocks, finalises them, and moves the
currency between accounts. It has no assets, no fees, no issuance and no treasury, each for a recorded
reason.

---

## 2. What was false

The realignment's own sweep on 20 September rewrote every reference to the deleted chain in the *source*
and in the top-level documents. It missed two whole categories.

**It missed the launcher's frontend.** Active-scope code still describes the deleted chain to the user:

- `Inventory.tsx:6` — "The chain exposes `drc369_balanceOf` and `drc369_ownerOf`". That is the deleted
  chain's private RPC vocabulary. The current chain has neither, and no DRC-369 pallet exists.
- `Inventory.tsx:13` — "Transaction history *is* fully available". The host refuses history, citing
  ADR-028's unbuilt indexer. The view and its own backend contradict each other.
- `Horizon.tsx:43` — "DRC-369 asset queries — **ready**". DRC-369 does not exist.
- `Horizon.tsx:113` — "Transfers currently write straight to node storage and never enter a block." The
  launcher submits an extrinsic and waits for GRANDPA finality.

This matters more than an ordinary stale comment because `systems.ts:7-21` states that the point of the
file is a launcher that does not lie.

**It missed the security document's opening.** The three bullets under "the most serious today" in
`SECURITY.md:10-21` are all about the deleted chain — no finality, no chain identifier in signatures,
forged signatures accepted. All three are false of the chain that exists. Worse, the live chain's one
*deliberate* signature gap — Ed25519 accepting a small-order forgery under the SDK's ZIP-215 rule,
accepted by ADR-038 — is not stated anywhere in that document. The first thing a reader sees is a
description of a chain that is gone, and the real accepted risk is absent.

**Three more documents describe fixed problems as live:** `AGENT_KEY_CUSTODY.md` §1-2 describes agent
private-key generation that migration 011 removed; `ADDRESS_TYPE.md` §1's citations were inverted by
ADR-041; `RECONCILIATION.md` §4.2's trust table has six of nine rows false. `RECONCILIATION.md` is
half-frozen and half-live with no marker saying which is which.

### An error introduced by this session, and corrected here

On 20 September a change-log entry recorded that roadmap items **M1.1 to M1.7** were uncounted by any
gate and that their disposition was an open question.

**Those items do not exist.** M1 is prose with no checkboxes. The phantom items are an artefact of the
coverage-check script published in `HANDOFF.md`: it matches headings against `^#{3,4} (M\d+|L\d+)` and
never resets its current-milestone variable on a heading that does not match. `### 7.1 Security track`
leaves it pointing at `M1`, so the seven security-track items are reattributed as `M1.1`…`M1.7`. Reset
the variable on any heading and the only genuinely uncounted item is `L2.1`, which is deliberate and
documented.

The script ran, its output was reported as fact, and nobody checked whether the items it named existed.
The change-log entry is history and stays as written; the correction is a later entry, and the script is
fixed.

---

## 3. Nine credentials in the tree, covered by no record

| File | Lines | What |
| --- | --- | --- |
| `docker/n8n/docker-compose.yml` | 8, 31, 36, 41 | Postgres password, its duplicate, a 64-hex **n8n master encryption key**, a basic-auth password |
| `docker/docker-compose.testnet.yml` | 25, 59, 89, 119, 184 | Four raw **libp2p node secret keys**, and a Grafana admin password |

`SECURITY.md` names neither file. The three secrets it *does* record were removed from the tree and
**rotated — confirmed by the owner on 2026-09-14** (`HANDOFF.md`). These nine have no such record.

**CI could never have caught them.** The credential scan's pathspec is `*.toml`, `*.env`, `*.env.*`;
both files are `.yml`. It matches two lowercase TOML key names. The key-material scan matches PEM armour
and OpenSSH filenames, never raw hex. It would pass a tree containing all nine. And the job it lives in
has never executed.

**Is this repository's history safe to make public?** Not today, but the obstacle is small and fully
enumerable, and **no history rewriting is required**.

The history is 130 commits rooted at a single squashed import on 2026-09-09. Across all of them there is
no SSH or PEM private key, no AWS key, no GitHub token, no Slack, Stripe, Resend, Google or Anthropic
key, no signed JWT and no mnemonic. What stands in the way is the nine values above, which are in the
tree **now** and would be on the front page, plus confirming that the three already-recorded secrets are
genuinely dead. Rotate the nine, decide whether those two files are kept or deleted, extend the rotation
record to cover them, and the history is publishable.

**A correction to the brief:** `Astra-Matrix/DEMIURGE-PROTOCOL` is **private**, not public — 0 forks, 2
stars, unauthenticated API returns 404. It does hold an SSH private key at `.ssh/id_ed25519_pleroma` in
its history, but it is not publicly exposed and **it is not in this repository's history at all**, which
was confirmed by direct search.

---

## 4. Continuous integration: the block is above the workflow file

Two competing explanations existed: an invalid `ci.yml`, or an account-level block. The experiment
settled it.

A four-line workflow — a name, `on: push`, one job running `echo ok` — was pushed as run
`35622108578`. It produced **zero runs of its own**. GitHub never registered it. The only artefact was
the same synthetic placeholder every other failure gets: `name: ""`, `path: "BuildFailed"`, and a
`workflow_id` belonging to no registered workflow.

A workflow that fails validation fails *as itself*, with its own name on the run. This fails before any
workflow exists to name. **`ci.yml` is not the cause.** What remains is an account-level block, most
likely a spending limit on a private repository — consistent with every piece of evidence, and **not
confirmed**, because reading billing needs a token scope this session did not have and did not request.

The consequence is not cosmetic. Seven gate criteria across three gates read CI results. `[kinds.ci]`
reads the latest run of a named workflow on a branch; the 22 placeholder runs carry a blank workflow
name and are invisible to that query, so the criterion reads a cancelled run from 2026-09-09. And every
"CI fails if…" sentence in `SECURITY.md`, `AGENTS.md` and `CONTRIBUTING.md` describes an unexercised
guard as an enforced invariant.

---

## 5. Can the asset work start?

**M4 is not blocked by economics and not blocked by anything technical. It is blocked by two unticked
items in M2, one of which is a rule.**

| Dependency | State |
| --- | --- |
| **M2.1 — the owner reviews the migration inventory** | **Unticked, and blocking.** `AGENTS.md` §7: no migration code until it is reviewed. A DRC-369 pallet is migration code. One document, one sitting |
| **M2.3 — the DRC-369 wire format** | **Unticked, and blocking.** M4 builds the thing whose format M2.3 fixes. Building first decides it by accident, which is what `beta.wire-format-frozen` exists to prevent |
| **ADR-025 — build on `pallet-nfts`** | **Accepted.** The design decision is made |
| **R-2 — refuse nesting cycles** | Carried to M4.5, landing with the pallet that owns it |
| **OPEN-1 / OPEN-2 / OPEN-4** | Block **M4.4 only** — sponsored fees need a fee to sponsor |

**With M2.1 and M2.3 cleared, M4.1, M4.2, M4.3 and M4.5 can start immediately.** Nothing else is in the
way, and none of them needs a number that has not been decided.

---

## 6. The fix list

### Doing now, autonomously

Documentation corrections where the tree disagrees; gate corrections where evidence does not exist; CI
configuration; the ticker reversal under its own rule; deployment configuration. One commit per concern,
verified at each.

- The launcher frontend's descriptions of the deleted chain (`Inventory.tsx`, `Horizon.tsx`).
- `SECURITY.md`'s opening three bullets, plus the missing statement of the live ZIP-215 acceptance.
- `DIRECTION.md` §"The base layer today" — four false statements in twelve lines, contradicted by §6 of
  the same file.
- `AGENT_KEY_CUSTODY.md`, `ADDRESS_TYPE.md` §1, `RECONCILIATION.md` and `PLATFORM_REALIGNMENT.md` —
  reader's notes at the head, and corrected citations in place.
- Every "CI fails if…" qualified to "will fail once a job executes".
- The coverage-check script's heading bug, and the M1.1–M1.7 correction.
- `PROTOCOL.md` brought up to ADR-041's `MultiAddress`.
- The Argon2 memory abort in the launcher's test suite, and the repeat-runs script's abort handling.
- CORS replaced with a configuration-driven allowlist.
- The two-validator job moved to manual and nightly.
- The ticker returned to CGT (§7).

### Needs an owner decision

Each is a question with a recommendation, listed in `OWNER.md` in the order they block things.

1. **Billing**, so a CI job can execute. Everything that reads CI is unreadable until then.
2. **Rotate the nine credentials**, and decide whether `docker/n8n/` and `docker/docker-compose.testnet.yml`
   are kept or deleted.
3. **`alpha.security-track` counts item 7.1.4**, whose subject was deleted with the old chain and whose
   work returns as M4.1/M4.2/M4.5. Leaving the tick with a forward note is a documentation fix;
   *removing* it from the gate is loosening, and that is the owner's call under `GATES.toml`'s own rule.
4. **What `systems.ts` is.** It is a second roadmap, which `AGENTS.md` §3 forbids, and it advertises nine
   frozen apps as reachable systems.
5. **`DIRECTION.md`'s definition of the launcher's surfaces** does not match the launcher.
6. **Define or drop** QOR Engine, relays, agentic synchronisation, QOR Wallet and Demiurge Exchange —
   Demiurge Exchange first, because its two readings are opposites under ADR-002.
7. **What VYB Social is**, because Agora's roadmap item depends on it.
8. **The hosting decisions** need new ADRs; ADR-015 says in terms that Railway is not used.
9. **`password_min_length = 8`** in the production configuration, against a code default of 12.

### Deferred, with reasons

- **The pin-move measurement** — whether a later `polkadot-stable2606` patch admits a fixed
  `hickory-proto`. It needs the manifest edited to measure, and editing it is the move. Its own task, on
  a scratch branch.
- **ADR-043's identity-provider flow.** The two-faces decision puts the browser face and the frontends
  on the same registrable domain, so the cross-domain problem the ADR was written to solve no longer
  exists. Its other three decisions stand. Re-justifying it on per-frontend isolation is a new record,
  not an edit.
- **The seven 501 routes and the dead `music.rs`** in QOR ID. Removing them is a scope call.
- **Populating session IP address and last activity.** Real, recorded, and cheapest to do when the
  session model is next open.

---

## 7. The ticker

Recorded in [ADR-045](decisions/ADR-045-the-ticker-returns-to-cgt.md), which supersedes ADR-034.
