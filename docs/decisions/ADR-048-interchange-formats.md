# ADR-048: Interchange formats, so a creator can leave with their work

**Status:** **Accepted**, 28 September 2026, by the project owner. Proposed 21 September 2026.
**Scope:** the read/write matrix for QOR Engine, Qontrol, GNOSIS, Market/Library, Stream and QFX. Formats only.
**Follows:** [ADR-001](ADR-001-innovation-budget.md) (proven foundations where failure is silent),
[ADR-002](ADR-002-value-from-spending.md) (creators are paid for use), [ADR-008](ADR-008-language-discipline.md),
[ADR-009](ADR-009-universal-minting.md) (the wire format is frozen before any SDK ships), and
[ADR-025](ADR-025-drc369-on-pallet-nfts.md) (DRC-369 carries a content fingerprint).
**Depends on nothing being built.** Every format named here is external and already specified.

## Context

**Five of the six products have no scope in this tree, and one exists twice over as a placeholder.** `docs/SYSTEMS.md:86`
records QOR Engine as named only, subdomain reserved and no scope; `SYSTEMS.md:55` records Market as planned and "does
not exist in the launcher at all"; `SYSTEMS.md:51` records Library as a placeholder. GNOSIS, Stream and QFX have no
occurrence in any tracked `.md`, `.rs`, `.ts` or `.toml`, checked 2026-09-21 — "Gnosis" appears only in frozen
`apps/hub` lore files, which `AGENTS.md` §3 says are not a reference. Qontrol is the one exception, two comment lines
old: `tools/qor-launcher/src-tauri/Cargo.toml:29,34` names it while declaring `gix` and pointing at the `qontrol-git`
sidecar — a dependency note, not a scope. `SYSTEMS.md:81` forbids inventing scope here, and this record invents none.
That was measured before two commits the same day: Qontrol's Projects surface (`5a44207`) and QFX layer one
(`75b2ead`) now exist as launcher surfaces, and each product has a blueprint in `docs/blueprints/`. A surface is not
a scope in this record's sense, and it still grants none.

**The substrate under them is thinner still.** `chain/runtime/src/lib.rs:324-340` holds System, Timestamp, Aura, Grandpa,
Balances, Session, ValidatorSet and a feature-gated Sudo: no assets pallet, no NFTs pallet, no storage pallet, so there
is nowhere on chain to put an asset today. DRC-369 is **M4 and unstarted**, its wire format **M2.3 and undecided** —
[`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md):225, "the bounds become part of the DRC-369 wire
format, so they are chosen before any SDK is published". The content fingerprint is **absent**
(`MIGRATION_INVENTORY.md:163`); the Mesh that would hold the bytes is **M8.1**.

**So why decide now.** Formats are chosen by whichever product ships first, silently, and then inherited — the column
ADR-001 says to stay boring in, because a creator discovers a bad choice years later, when they try to leave, and the
failure is total. Deciding once, before any of the six has a scope, costs nothing.

**Three settled things bound this record.** QOR Engine is a custom build of Godot tracking upstream, never a hard fork,
with QOR's additions as modules and editor plugins. GNOSIS's project format takes Godot's `.tscn` property — text,
diffable, mergeable — as a requirement, citing `.tscn` as the precedent, and QFX's scene editor is an editor plugin in
that build, not a second tool. Qontrol is gitoxide for every read path, libgit2 in a sidecar for stage and write-tree.

**External facts moved recently enough that older plans are stale.** glTF 2.0 became ISO/IEC 12113:2022. FLAC became
IETF RFC 9639 in December 2024, so it is now as citable as WAV at a third the size. The VST 3 SDK became **MIT at 3.8.0
in October 2025** — no fees, no membership, no documents to sign — invalidating any plan that routed around VST3 for
licensing. The W3C Design Tokens Community Group's format module reached stable 2025.10 on 28 October 2025, and AOUSD
Core Specification 1.0 shipped, with ISO certification beginning at 1.1.

## Decision

1. **Every product's exit is stated in three tiers, and the tier word appears in the interface, not only in a document.**
   **T1, the artifact** — the baked output; **T2, the source** — the editable project; **T3, the graph** — provenance,
   splits, licence terms, entitlements. A control producing a file is labelled **lossless**, **bake** (T1 only) or
   **carry** (opens only with the same tools). **T1 is lossless everywhere**, and a product that cannot is not shipped.

2. **glTF 2.0 / GLB is the 3D floor: read and write, everywhere 3D appears.** Royalty-free, ISO/IEC 12113:2022, Godot's
   recommended format with import and export in core, and the official Khronos add-on in Blender. It carries no modifier
   stacks, constraint rigs or procedural graphs, so a glTF round trip is a **bake** and is labelled one.

3. **OpenUSD is the T2 scene target: read now, write when a product has scope and budget for it.** Its licence is the
   Tomorrow Open Source Technology License 1.0, differing from Apache 2.0 only in §6, which forbids using the licensor's
   names — implementable and redistributable, and no product is named after it. Composition is what glTF cannot do. It is
   absent from Godot core because the library is 200+ MB, and the three GDExtensions (`meshula/usd-godot`,
   `tefusion/godot-usd`, V-Sekai's `idtx-flow`) are **unverified for production**, so USD write is a 12-month item.

4. **FBX is read and never written.** `ufbx` is MIT, clean-room and read-only, and is what Godot 4.3+ uses. There is **no
   permissively licensed FBX writer**: writing means the Autodesk SDK inside a shipped product under a binary-only,
   non-redistributable agreement, or a reimplementation whose correctness cannot be shown. An FBX that opens wrong is
   worse than none: the creator believes they left with their work and finds out later.

5. **The engine's own formats are a versioned source and a build output, never the only form of an asset.** `.tscn` is
   text, diffable and mergeable — precisely why it is fit to be what Qontrol versions and the precedent GNOSIS's format
   follows — but it is a Godot dialect. Every asset also exists as glTF, every shader as SPIR-V plus MaterialX plus
   source, and `.pck` is never an archive of record. Copy reads **"QOR Engine, built on Godot"**, never endorsement.

6. **Audio: master in WAV/BWF/RF64, archive in FLAC, deliver in Opus; notes are Standard MIDI Files.** FLAC is RFC 9639,
   Standards Track; Opus is RFC 6716 in the Ogg container of RFC 7845; SMF is the most portable music format in
   existence. None is encumbered. MIDI 2.0 / UMP is read at the device boundary where a device speaks it, but the MIDI
   2.0 clip file is **not** an exit format, because it is unverified that any mainstream DAW writes one.

7. **Cross-DAW project interchange does not exist, and Stream says so in plain words.** DAWproject (MIT, v1.0, Bitwig and
   PreSonus) is the only serious attempt: as of November 2024 supported by Bitwig Studio 5.0.9, Studio One 6.5, Cubase
   14, Cubasis 3.7.1 and VST Live 2.2, and by none of Ableton Live, Logic Pro, Pro Tools, FL Studio, REAPER or Ardour —
   most of the installed base; whether any added it since is **unverified**. It carries plugin state as a vendor blob
   keyed by plugin identity — **inferred from the format's design, unverified against the schema, to be confirmed before
   it reaches product copy** — which is carriage, not portability. Stream labels it **carry** and says so in the dialog:
   *"A DAWproject export carries your arrangement, your automation and your plugin settings. It does not carry your
   plugins. On a machine without them, those tracks will be silent."*

8. **Rendered stems are co-exported automatically, never opt-in.** A stem is the plugin's output and is lossless as
   audio. This is the only thing that makes decision 7 survivable. The honest cross-DAW exit is, and remains, **stems
   plus a tempo map plus an SMF plus a plain-text session sheet**, which opens in every DAW ever made.

9. **Audio plugin hosting targets VST3 and CLAP; LV2 where Linux creators are in scope; AU only on macOS; AAX never,
   unless a named customer requires Pro Tools; VST2 never, because licences cannot be obtained.** VST3 and CLAP are both
   MIT and agreement-free, and together cover the commercial library and the whole open one. **No Demiurge-only plugin
   format is invented** — that would be a sixth asset format under a new name.

10. **Qontrol reads and writes the real git object format, and large objects stay addressable by anyone.**
    Content-addressed objects, packfile v2, and `git bundle` as the T2 exit: one file, full history, offline, openable by
    plain `git`. Per the Qontrol record, gitoxide serves every read path and a libgit2 sidecar serves stage and
    write-tree only. SHA-1 stays the default while **GitHub still cannot host SHA-256 repositories**; Git 3.0 is expected
    to default to SHA-256, though that date is unverified. The repository config and `.gitattributes` — `autocrlf` and
    case included — are honoured as git honours them. Large objects are content-addressed and their addressing
    published, because git-lfs is the shape to avoid: an MIT client whose server side is the Batch API, so a creator
    keeps their large objects only while the host's endpoint answers.

11. **A portable shader package is five things shipped together**: a manifest, MaterialX graphs, SPIR-V per entry point,
    the authored source in its own language, and textures in PNG, EXR or KTX2, with inputs, defaults and bindings
    declared. SPIR-V runs, MaterialX carries the intent, the source lets the creator leave; portable for the **common
    subset**, not by construction — exotic modules do not all survive a trip to WGSL.

12. **Themes read and write DTCG 2025.10 JSON.** `tools/qor-launcher/src/styles/themes.ts:6` already defines a theme as
    "a small set of colours, not a skin", with `void`, `base`, `surface`, `raised`, `well`, the accent trio and the ink
    ramp — a design-token system missing only a serialiser, and the only lock-in removal here with no blocker.

13. **Every exported artifact carries a C2PA manifest** (specification 2.4, 21 April 2026; ISO/DIS 22144 defines the
    framework), so it proves its own origin without Demiurge existing. C2PA does origin, not economics: no royalty split,
    licence term or entitlement. **The assertion shape is one substrate decision across all six products.**

14. **The matrix.** Normative wherever a product acquires a scope; it does not grant one.

| Product | READ | WRITE | Exit quality |
| --- | --- | --- | --- |
| **QOR Engine** (Godot build) | glTF/GLB, USD, FBX (`ufbx`, read-only), PNG/KTX2/EXR, WAV/FLAC, GLSL/WGSL/SPIR-V/MaterialX, `.tscn` | glTF/GLB (T1), `.tscn` (versioned source), SPIR-V + MaterialX + source, USD when scoped | lossless T1; bake for procedural; `.tscn` flagged |
| **Qontrol** | git objects, packfile v2, bundles, LFS pointers, any working tree | `git bundle` with full history, large objects materialised not referenced | **lossless** |
| **GNOSIS** | its own text project format, Markdown, JSON, MCP on the wire | the same, text, diffable, mergeable | lossless, by construction |
| **Market / Library** | zip, OCI layout, glTF/PNG/WebP/FLAC/Opus/AV1, Markdown, DTCG | a content-addressed directory plus a manifest — never a proprietary package | lossless T1; T3 blocked |
| **Stream** | WAV/BWF/RF64, FLAC, AIFF, Opus/AAC/MP3, SMF, UMP, DAWproject, AAF/OTIO | FLAC (archive), Opus (delivery), stems, SMF, DAWproject | lossless T1; **carry** for the session |
| **QFX** | PNG/EXR/KTX2, AV1, glTF, GLSL/WGSL/HLSL/SPIR-V, MaterialX, DTCG | SPIR-V + MaterialX + source together; MaterialX; DTCG 2025.10 | lossless, common subset |

15. **No product invents an asset descriptor, a content fingerprint, a licence vocabulary, an entitlement format or a
    settlement rail.** Where one is needed and missing, it is recorded as a substrate gap and left empty. Six products
    inventing an asset format breaks the substrate rule on day one.

## Consequences

| Work | Class | Honest size |
| --- | --- | --- |
| DTCG theme read/write | reused | ~1 week; `themes.ts` is already token-shaped |
| glTF read/write | reused | mature Rust and engine libraries; no invention |
| FLAC, Opus, WAV, SMF | reused | RFC-specified, reference implementations everywhere |
| git objects and bundle export | reused | gitoxide plus the libgit2 sidecar; do not write a new one |
| SPIR-V + MaterialX package | new | ~3 months; the toolchain exists, the manifest is the new part |
| C2PA manifest writing | new | ~3 months, and blocked on the signing-identity decision |
| VST3 + CLAP hosting | new | ~3 months to work, ~12 to be trustworthy: sandboxing, crash isolation, delay compensation, state restore |
| DAWproject read/write | new | ~3 months once Stream has a session model, which it does not |
| OpenUSD write | new | ~12 months; Godot core declined the library for its size, and that reason applies here too |
| A DRC-369 wire format these all target | blocked | M2.3, behind M2.1; no migration code before the owner reads the inventory |

**What "full support" does not mean.** Not that a round trip through another tool gives back what you put in. Not that a
modifier stack, a geometry node graph or a node-based DAW device survives — no format carries another application's
procedural semantics, and Blender's own USD exporter degrades Geometry Nodes instancing in documented ways. Not that a
DAWproject opens with sound on a machine lacking the plugins. Not Unity or Unreal round-trip: those are **assets-only**,
via glTF and USD plus existing community migration tools. Godot's renderer is not Unreal's, which is fine: not the target.

**Alternatives rejected.**

- **A single Demiurge container format for everything.** Lost to ADR-001: invention where failure is silent, the seventh
  format in a record about not having seven, and a collision with the DRC-369 wire format the moment M2.3 decides one.
- **Writing FBX via the Autodesk SDK.** Lost to the FBX SDK licence agreement: binary-only and not redistributable, so an
  open toolchain cannot be built on it. A clean-room writer lost because correctness cannot be shown against a closed
  format; `ufbx` covers the read side honestly.
- **OpenUSD as the T1 delivery format instead of glTF.** Lost on three named counts: 200+ MB of library that Godot core
  declined over download size; three GDExtensions, none a shipped supported path; and documented silent degradations on
  export — first material applied to the whole mesh, no UDIM in USDZ, no file sequences, no bendy bones.
- **`.tscn` as the master format.** Lost because an engine's scene dialect is the engine: it names Godot node classes and
  resource paths, so reading it elsewhere means reimplementing Godot. It wins instead as the *versioned source*.
- **DAWproject as the headline exit promise.** Lost on installed base (absent from Ableton Live, Logic Pro, Pro Tools, FL
  Studio, REAPER and Ardour) and on plugin-state opacity. AAF lost separately — clips, edits, fades and pan/volume
  automation, but no instrument tracks, no note data, no portable plugin state: the video-post lineage, not music.
- **AAX, and VST2.** AAX lost on third-party requirements no open toolchain can absorb: Avid developer registration, an
  iLok account, and PACE digital signing on an annual subscription. VST2 lost because Steinberg stopped issuing licences
  in October 2018 and withdrew the SDK, so a new entrant cannot obtain one at all.
- **A Demiurge LFS-style endpoint for large objects.** Lost because it reproduces the one place lock-in actually lives in
  git: not the object format, which is open, but the Batch API server deciding whether the bytes stay fetchable.
- **SPIR-V alone as the shader exit.** Lost because a binary IR that does not fully survive translation to WGSL is not an
  exit; MaterialX carries the intent, and the authored source carries what neither of them does.
- **A Demiurge theme JSON.** Lost to DTCG 2025.10: stable since 28 October 2025, backed by 40+ organisations, with tool
  support shipping in Figma, Penpot, Style Dictionary and others. Inventing costs more and reaches fewer tools.
- **Deferring all of this until DRC-369 exists.** Lost because the first product to ship would decide it by accident, and
  the decision would be inherited without ever having been made.

**Substrate gaps, named rather than filled.** There is no asset format (DRC-369, M4; wire format M2.3). There is no
content fingerprint (`MIGRATION_INVENTORY.md:163`) and no store for the bytes (the Mesh, M8.1) — naming the fingerprint
scheme is an owner decision for M2.3, because it becomes expensive the moment an SDK ships (ADR-009). There is no
licence vocabulary, though Stream needs per-play terms, Market resale terms, Library entitlement terms and QFX remix
terms; four products will otherwise invent four. There is no entitlement format (M8.2). Exported files carry no field
saying which QOR ID made them or which CGT account settles to them. And there is no settlement rail above a balance
transfer: the runtime has `pallet_balances` and no transaction-payment pallet, with **fee classes U-4, the burn share
per fee class OPEN-4, perpetual issuance OPEN-1 and the genesis split OPEN-2 all undecided**.

## What this record does not decide

- **It does not give any product a scope**; a format matrix is not a definition, and `docs/SYSTEMS.md:86` still says of
  QOR Engine: define it or drop it.
- **It does not decide the DRC-369 wire format**, its bounds, its identity, or the content fingerprint scheme — a
  per-file SHA-256 Merkle root, as BitTorrent v2 (BEP 52) uses, and an IPFS CID/multihash both keep files fetchable by
  non-Demiurge tools. That is M2.3 and the owner's.
- **It does not define the licence, royalty or entitlement vocabulary, nor the C2PA assertion shape.** That vocabulary
  is where inventing a format is correct — nobody has one, C2PA does origin not economics — and it needs its own record.
- **It does not set any economic value.** No rate, split, burn share or fee class appears here; OPEN-1, OPEN-2 and OPEN-4
  remain open, as does U-4. No product may invent one to get moving.
- **It does not authorise migration code** (the owner reads
  [`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) first), name a pallet, or change any gate or check.
