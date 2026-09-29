# ADR-051: QFX renders on one WebGL2 canvas behind the interface, under contracts the chrome owns

**Status:** **Accepted, 22 September 2026, by the project owner, as amended that day.** Proposed on 21 September
2026. The owner chose to amend it to fit the layer that had already been built rather than to rebuild the layer:
decisions 7, 11, 12, 13, 14, 16 and 17 below carry the amendments, each marked. The owner's rule, verbatim: **the
design system governs the default theme and the chrome; QFX governs the canvas; the default must still pass
`check-design.mjs` unchanged.**
**Depends on:** [ADR-001](ADR-001-innovation-budget.md) (proven foundations where failure is silent),
[ADR-008](ADR-008-language-discipline.md) (language discipline), [ADR-025](ADR-025-drc369-on-pallet-nfts.md) (a theme
is a DRC-369 asset, not a new asset format), [ADR-032](ADR-032-chain-location-and-names.md) (plain names for anything
outside developers read), [ADR-045](ADR-045-the-ticker-returns-to-cgt.md) (the ticker is CGT).
**If accepted, amends in the same change:** `docs/DIRECTION.md` §5, `docs/design/DESIGN_SYSTEM.md` §1 (the ruled-out
list) and §6 (the idle-motion sentence at `DESIGN_SYSTEM.md:138`), and records a scope change in
`docs/GATES.toml`'s `[[change_log]]`.

## Context

**Layer one was built before this record was accepted, and it is not this record.** At the owner's instruction,
commit `75b2ead` built layer one's first slice on 21 September 2026, and `42d00c3` logged the narrowing of
`check-design.mjs` that decision 17 describes, as a scope change and without a separate prior approval. What was
built differed from the decisions as first proposed in four ways. **The owner resolved all four on 22 September
2026 by amending this record, not the code** (decisions 11, 12, 13 and 14):

- **The canvas is mounted behind the Gate too** (`src/App.tsx:90`, outside the signed-in branch). Decision 11
  as proposed said it never is; as amended, only the built-in default ambience may run there.
- **The guarantee is one full-screen scrim over the canvas** (`qor.css`, `--qfx-scrim-alpha`, 0.86 when built and
  0.90 since 22 September), checked by `scripts/check-contrast.mjs`, not a luminance clamp plus the 72% panel
  scrim. Decision 14 as amended accepts the scrim.
- **The budget is one step:** sustained frames over 24 ms (a net 30 of them) stop the canvas on its last frame
  (`src/qfx/Canvas.tsx`), not a tier ladder and governor. Decision 12 as amended accepts it for v0.
- **There is no separate pause control.** Decision 13 as amended: Still is the pause.

Ambience Off first shipped with a defect — the canvas kept its last frame with the scrim removed — which was
corrected the same day (`6e5bb28`) and is pinned in `scripts/check-accessibility.mjs`. The rest of this Context describes the
tree before `75b2ead`.

**The launcher's own CI forbade QFX.** `tools/qor-launcher/scripts/check-design.mjs` fails the build on
`getContext(|requestAnimationFrame` ("No canvas or frame-loop animation", `check-design.mjs:54-56`) and on
`onPointerMove|pointermove|--px|--py|aura` ("No light or effects that follow the pointer", `check-design.mjs:49-51`),
across all of `src/`. QFX layer one does all four things on every frame. The rules are stated at
`src/styles/qor.css:13-15`, `docs/design/DESIGN_SYSTEM.md:15-21` and `docs/DIRECTION.md:158`, and removing "the
particle field, glows and pointer light" is a *completed* roadmap item, L1.1 (`DIRECTION.md:417`). Widening the check
without a record is the quiet loosening `docs/GATES.toml` forbids.

**The platform is the system webview, three of them.** `src-tauri/Cargo.toml` pins Tauri 2: WebView2 on Windows,
WKWebView on macOS, WebKitGTK on Linux. WebGL2 is reliable on the first two. On Linux it landed only in WebKitGTK
2.40.0 (March 2023), Ubuntu 22.04 ships 2.36, and Tauri's Linux graphics guidance records that context creation
succeeds when the result is a software rasteriser, that `WEBGL_debug_renderer_info` is masked against fingerprinting,
and that a WebGL path needs a non-WebGL fallback.

**The host forbids `unsafe`, and a theme has nowhere to live.** `src-tauri/Cargo.toml:15` sets
`unsafe_code = "forbid"`, which `#[allow]` cannot override, and loopback audio is `unsafe` FFI. `chain/pallets/`
holds one pallet; DRC-369 is M4 and unstarted; the Mesh is M8.1; `RECONCILIATION.md:434` records storage Unknown.

**The accessibility machinery exists and QFX escapes all of it.** `src/lib/a11y.ts:84` writes `data-motion` on
`<html>`; `qor.css:433-440` and `qor.css:513-519` enforce reduced motion with `!important` declarations whose
precedence is deliberate and explained in place (`qor.css:457`, `qor.css:468-470`); `qor.css:551-556` and
`qor.css:560-561` make panels opaque at `data-contrast='maximum'` and under `data-solid`. A `requestAnimationFrame`
loop driving a WebGL canvas is not CSS, so none of it reaches QFX unless code reads the flag.

## Decision

1. **One webview, one canvas, sibling of `#qor-root`.** `position: fixed; inset: 0; z-index: 0; pointer-events:
   none; aria-hidden="true"`, outside the `#qor-main` landmark and the tab order. A sibling, not a child, because
   `qor.css:119` applies `zoom: var(--ui-scale)` to `#qor-root`, which would rescale it and mismatch its drawing
   buffer. `body`'s `--base` fill (`qor.css:122-124`) becomes transparent and the canvas clears to `--base`.
2. **WebGL2 is the baseline and the only renderer in v0. There is no WebGPU path.** WebGPU is on by default in
   WebView2 but uncontracted by Microsoft for that surface, absent in WKWebView before macOS 26 and unverified after,
   and on WebKitGTK does not exist. A second renderer waits until a theme class needs compute.
3. **Capability detection is a timed calibration render, never a version or renderer-string check**, because Linux
   both masks the renderer and succeeds on software. N offscreen frames at a known resolution set the tier at first
   run; the result is stored and re-measured when the GPU, driver or display configuration changes.
4. **Tier 0 is a first-class state, not a failure.** No WebGL2, software rasteriser, reduced motion, or a governor
   that gave up all produce a still ground in `--void`/`--base`: the launcher exactly as it looks today.
5. **Audio analysis runs in the Rust host, and `unsafe_code = "forbid"` stays.** The `unsafe` lives in `cpal` and
   `wasapi`. Windows: WASAPI loopback on the render endpoint, shared mode. macOS: Core Audio process taps, API from
   14.2 and usable from 14.4, under `kTCCServiceAudioCapture`, which TCC keys to a stable code-signing identity — so
   **macOS loopback is gated on signed installers**. Linux: the `.monitor` source. Microphone capture uses `cpal`.
6. **Bands are streamed over `tauri::ipc::Channel` at a fixed 30 Hz**: 2048-sample Hann FFT, 12 logarithmic bands
   with fast-attack slow-release envelopes, plus level and an onset flag — fourteen `f32`, 56 bytes a frame, under
   Tauri's raw fast-path threshold. The shader gets current and previous bands and interpolates on its own clock, so
   60 fps motion runs off 30 Hz data.
7. **Audio capture is off by default, opt-in in Settings, with a persistent indicator while live.** A theme manifest
   declares audio *mappings* and grants nothing; with audio off every band is zero, the theme still runs, and it
   cannot detect the difference, so it cannot nag. *Amended 22 September 2026, the owner's order:* **system sound
   first, the microphone later, and neither in v0.**
8. **A theme is a package of data with no code**: a `qfx.toml` manifest carrying the fifteen palette tokens exactly
   as `Theme['tokens']` defines them in `src/styles/themes.ts:37`, one fragment shader, a fully declared and bounded
   parameter table, audio mappings, pointer settings, motion tokens the chrome reads, and a contrast request. It
   ships no JavaScript, registers no callback, holds no timer, and unknown keys are rejected: **the QFX runtime owns
   the single frame loop, the clock and the uniform block.** The manifest is text, diffable and mergeable, for the
   reason Godot's `.tscn` is: a theme has to survive a review and a merge conflict.
9. **Shaders are validated in the host with `naga` before they reach the webview, against a published subset.**
   `naga::front::glsl` parses, `naga::valid::Validator` checks, and the runtime walks the IR to reject unbounded
   loops, dynamic indexing without bounds, deep call chains and reads of undeclared uniforms, under a complexity
   budget: `for` only, literal bound at most 64, no `while`, no `do`, no recursion, no `discard`, no textures in v1.
   A shader compiles under a 2 s abandon, gets a 64×64 probation frame, and is blacklisted if it loses the context.
10. **`naga` is a correctness checker and is stated in the code as not a security boundary.** The last line of
    defence is the driver watchdog, and a watchdog reset flickers every GPU window on the machine. That is why
    decisions 8 and 9 exist and why textures are refused in v1; before any scene may load an image, `img-src` in
    `tauri.conf.json:37` is narrowed from `'self' data: blob: https:`, which today would let a theme fingerprint a
    viewer by fetching from an arbitrary origin.
11. **The boundary: the chrome owns everything a person must read, hit or trust; QFX owns the ground behind it.**
    The canvas never reaches the host-drawn signature dialog, which is native and outside the webview, and never
    tints status colours, which are the same in every theme. `data-contrast="maximum"` and `data-solid` set the
    canvas to hidden, extending the kill switches at `qor.css:551-556` and `qor.css:560-561`. *Amended 22 September
    2026:* **behind the Gate, only the built-in default ambience may run, never an installed theme**, because the
    Gate is where a passphrase is typed and a theme's shader is code from strangers. Layer one complies: it has no
    installed themes. When installed themes exist (P2.5), the Gate falls back to the built-in default.
12. **Frame-time budget with tiers from v0**, measured from `requestAnimationFrame` deltas on the CPU, because
    `EXT_disjoint_timer_query_webgl2` has been disabled in Chromium since Chrome 65 as a side-channel mitigation:
    tier 0 still; tier 1 at 0.25× scale, 15 fps; tier 2 at 0.5× scale, 30 fps, the first-run default; tier 3 at
    0.75× scale, 60 fps, with `devicePixelRatio` capped at 2 and 60 Hz the ceiling. **The ambience takes at most 25%
    of the frame interval at tier 3 and 15% at tier 1**, because the interface still has a 420 ms entrance and a
    160 ms cross-fade to run (`DESIGN_SYSTEM.md:132-133`). The governor demotes on two consecutive 2-second windows
    whose p95 exceeds 1.35× the target interval, on occlusion, and on host-reported power state (read in the host,
    as `navigator.getBattery()` is Chromium-only), and promotes one tier at most every 30 seconds. *Amended
    22 September 2026:* **v0 has one step, accepted for v0** — sustained frames over 24 ms stop the canvas on its
    last frame. The tiers and the governor above are product-track work (P2.2), and **the 25% and 15% fractions
    are accepted** as their budget.
13. **Reduced motion means still, enforced by ownership.** At tier 0 the runtime draws one frame with time frozen,
    bands zero and pointer centred, then schedules no callback at all — so the test is binary, "is a callback
    registered", not "is it moving slowly". `data-motion` and `matchMedia('(prefers-reduced-motion: reduce)')` resolve
    through one function shared by the CSS and the runtime, watched with a `MutationObserver`. `tier_min` can only
    make a theme stiller; no field makes a theme run when the runtime says still. *Amended 22 September 2026:*
    **Still is the pause.** WCAG 2.2 SC 2.2.2 asks for a way to pause, stop or hide motion that starts on its own;
    Settings → Accessibility → Ambience → Still pauses it and Off hides it, both reachable by keyboard. There is
    no separate pause control.
14. **The contrast guarantee is carried by the chrome and is closed-form.** *Amended 22 September 2026, replacing the
    luminance clamp this decision first proposed:* **the guarantee is one full-screen scrim the chrome owns** — a layer
    of `--base` between the canvas and the interface at `--qfx-scrim-alpha: 0.90`, a literal in `qor.css` and not a
    theme token, so no theme can reach it. **There is no brightness cap in v0:** the guarantee is computed against any
    colour the canvas could paint, white included, which makes a cap redundant. **The test is
    `scripts/check-contrast.mjs`**, which applies every shipped theme through the app and solves for the worst case.
    **Values recorded on 22 September 2026**, against a floor of 4.5:1: over any backdrop, `--ink-body` 10.87:1 or
    better, `--ink-muted` 5.54:1 or better and `--ink-faint` 4.61:1 or better; on every opaque background,
    `--ink-faint` 4.77:1 or better. `--ink-faint` measured 2.87–3.26:1 before it was fixed that day, in its own change
    (`320be99`), and may now be used over the ambience. The scrim rose from 0.86 to 0.90 for it, so the backdrop shows
    through at 10% rather than 14%. A `[contrast]` block in a theme can only ask for more readable,
    `max(theme.scrim_min, floor)`, never less.
15. **The gate is WCAG 2.x 4.5:1, with APCA computed as advisory**, because WCAG 3's contrast algorithm was still
    undetermined as of April 2026 and a release criterion cannot rest on an unsettled method. `contrast-color()` is
    not used: it is absent from Chromium and therefore from WebView2.
16. **Three checks join `scripts/check-accessibility.mjs`, which already serves `dist/`, drives headless Edge, stubs
    `__TAURI_INTERNALS__` and emulates media features (`check-accessibility.mjs:236-237`):** a static worst-case
    computation from computed styles and the clamp constant, which renders no shader and cannot be flaky; an
    adversarial render of a fixture theme whose shader outputs white, sampled behind each text node, needing
    `--enable-unsafe-swiftshader` beside `--disable-gpu` (`check-accessibility.mjs:74`); and two screenshots a second
    apart, byte-identical under emulated reduced motion. All three become `GATES.toml` criteria. *Amended
    22 September 2026, to the checks as built:* the worst-case computation is `scripts/check-contrast.mjs` (54
    checks), and reduced motion and Ambience are 21 cases in `check-accessibility.mjs` that drive the app and count
    frame callbacks — the binary test decision 13 asks for. The `qfx` gate reads both, as the suites `qfx_contrast`
    and `qfx_ambience`. The adversarial white-shader render and the byte-identical screenshots are P2.2.
17. **The check-scope split, which is a scope change and is logged. Exactly two rules — "No canvas or frame-loop
    animation" and "No light or effects that follow the pointer" — are exempted, and only under `src/qfx/**`.** Glows
    and shadows, gradients, colour literals outside the token files, the type and tracking scales and the CSS
    `infinite` rule keep applying inside `src/qfx/**` as everywhere else. Narrowing what a check governs is loosening
    under `docs/GATES.toml`'s rule, so it is the owner's decision, recorded in `[[change_log]]` as a `ci-scope` entry.
    *Amended 22 September 2026:* the split was made on 21 September with layer one (`42d00c3`), before any approval,
    and **the owner approved it on 22 September, retroactively**, with the rule this record's status states; both
    are in `[[change_log]]`.
18. **Built-in themes only, compiled into the launcher, until DRC-369 and the Mesh exist.** The package format,
    validator, tiering and contrast enforcement are built now against real content; when M4 and M8 land, the only new
    code is fetch-and-verify.

## Consequences

**What it makes possible, and why it is the enabling decision for the layers above it.** Layer two binds by token
write alone: the canvas is a sibling outside `#qor-root`'s zoom, owns no chrome and reads only canvas tokens, so a
theme can later set motion and material tokens through `clamp()` envelopes in `qor.css` without any component
learning that QFX exists, and the accessibility overrides keep winning — the contrast overrides because they sit
outside every cascade layer, the motion override because it carries `!important`. Layer three can reuse the scenes of
**QOR Engine, built on Godot**, because decision 8 makes a scene **declared data with a typed, bounded parameter
surface and no runtime of its own** — the shape a node graph compiles to and a scene graph nests, with the same
text-and-diffable property `.tscn` has. A QFX scene becomes a leaf in that graph, not a competing format, and the
shared scene editor stays an editor plugin in the custom build — QOR Engine being its own record, not accepted here,
and still listed in `docs/SYSTEMS.md` as named only.

**What it costs.** `backdrop-filter: blur(20px) saturate(140%)` on every panel (`qor.css:184`, `qor.css:203`) is
rasterised once over a static ground and every frame over a moving one; above tier 0 panels drop to an 8px blur or go
opaque, measured rather than assumed. A visible idle launcher draws power continuously, which is why the tier ladder
reads host power state. `DESIGN_SYSTEM.md:138` says no motion runs while the interface is idle; QFX contradicts that
sentence, and the amendment must say so rather than blur it. Build the contrast guarantee, the tier ladder and
still-means-still against a placeholder shader *before* opening the format to creators: the reverse order gives an
ambience nobody can turn down and no text can be read over, and every fix then fights a theme that already shipped.

**Feasibility, honestly.** Reused: the CDP accessibility harness, the theme token model, `applyTheme`, the five
palettes, the `data-*` attributes, the Tauri capability model. **Three months, one founder with an agent:** canvas
compositing, the tier ladder, the governor, the WebGL2 fragment runtime, the luminance clamp, both CI checks, and
host microphone capture with Windows loopback. **Twelve months:** the package format with `naga` validation,
probation rendering, context-loss blacklisting, and macOS loopback, which waits on a real signing identity.
**Beyond, and blocked:** theme distribution, which needs M4 and M8. "Full support" does not mean a theme marketplace,
WebGPU, themes from strangers, or a native GPU surface. The validator is the serious engineering here, and will
reject some legitimate shaders — the correct direction to fail in.

**Substrate gaps, named and not filled locally.** Theme payloads have nowhere to live: DRC-369 is M4 and unstarted,
the Mesh is M8.1, interim storage is Unknown. A downloader with its own URL scheme and signature check would be a
second distribution rail beside the Mesh and a second asset format beside DRC-369, so it is not built. Theme
authorship and remix lineage are DRC-369 semantics over QOR ID, not an `author` string in a TOML file. Whether the
wire format fingerprints shader bytes was an M2.3 input nobody had raised: outside the fingerprint, a theme's
behaviour can be swapped under its identity. **Decided on 22 September 2026: shader code is covered by the DRC-369
fingerprint**, because the same asset must not run different code; ADR-047's manifest does it by construction, since
a theme's shader is one of its entries. Paying to use a theme is a creator being paid for
use (ADR-002), settled in CGT through the royalties of M4.2 — **nothing here is priced and no share or rate is
chosen, because the issuance rate (OPEN-1), the genesis split (OPEN-2) and the burn share per fee class (OPEN-4) are
undecided.**

**Alternatives rejected.**

- **A second, transparent, always-behind window.** macOS transparency needs Tauri's `macOSPrivateApi`, forfeiting App
  Store eligibility; Windows transparency in Tauri v2 is reported broken relative to v1, and the window is
  `"transparent": false` with an opaque `backgroundColor` (`tauri.conf.json:25-26`); two windows never move or resize
  atomically, so dragging the launcher would lag its own backdrop; and two webviews double the GPU contexts.
- **A native `wgpu` surface composited under a transparent webview.** Technically the best answer and correctly out
  of reach: it needs WebView2 visual hosting, an `NSView` under a `WKWebView` and a `GtkGLArea` under the WebKitGTK
  widget, none exposed by Tauri, all colliding with `unsafe_code = "forbid"`. Beyond twelve months.
- **A CSS-and-SVG ambience, to avoid touching the design checks at all.** It cannot carry audio bands or a pointer
  field without per-frame style writes — a frame loop by another name, forcing the same exemption — and animated
  filters over blurred panels cost more per frame than one fragment pass; with no offscreen target to clamp,
  decision 14's closed-form guarantee degrades into per-theme inspection.
- **Audio in the webview via `getUserMedia` or `getDisplayMedia`.** `getUserMedia` cannot capture system loopback on
  any platform; `getDisplayMedia` can, but only in Chromium, only behind a picker dialog every time, and not at all in
  WKWebView or WebKitGTK. It would also move a privileged capability into the unprivileged half of the application.
- **Relaxing `unsafe_code` to `deny` to hand-roll WASAPI or Core Audio.** No benefit over `cpal` and `wasapi`, and it
  is the kind of lint that gets downgraded during an afternoon of debugging and never restored.
- **Letting a theme ship JavaScript, or exposing free-form uniforms.** It would make reduced motion an honour system,
  give a theme state the runtime cannot clamp, and break the preset model the layers above depend on.
- **`text-shadow` for legibility, or per-frame sampling of the backdrop to adapt text colour.** `text-shadow` is
  banned at `check-design.mjs:39-41` and untestable, since no tool computes contrast through a shadow; sampling costs
  a GPU readback every frame, and text that shifts colour as the ambience drifts is its own accessibility failure.
- **Widening `check-design.mjs` quietly, or exempting all of `src/`, or deleting the ornament rules.** A widened
  pattern with no `[[change_log]]` entry is the loosening `docs/GATES.toml` exists to prevent, and a blanket
  exemption is how glows and gradients return to panels one class at a time — what L1.1 was done to prevent.

## What this record does not decide

- ~~**It does not accept QFX.**~~ **Accepted on 22 September 2026**, with the amendments to `docs/DIRECTION.md` §5
  and `docs/design/DESIGN_SYSTEM.md` §1 and §6 that acceptance requires, made in the same change.
- **It does not name any published identifier.** A launcher-internal `src/qfx/` directory is internal naming; a theme
  asset type outside creators and toolmakers read takes plain names under ADR-032 and the owner's approval. *Until
  the owner names it, the theme asset type is called "QFX Theme"* (the owner, 22 September 2026).
- **It does not decide the DRC-369 wire format** — ADR-047 does, accepted the same day, and shader bytes are
  covered by it (above) — or how a theme is distributed, sold or priced: no rail, no fee class, no share.
- **It does not settle the Windows loopback permission rule**, which the Audacity report of 17 September 2026 leaves
  ambiguous on Windows 11, or WebGPU's real availability in WKWebView. Both are settled by measurement on a clean
  machine before anything is promised in copy.
- **It does not fix `--ink-faint`'s existing contrast failure**, which predates QFX and needed its own change. That
  change was made on 22 September 2026 by the owner's decision (`320be99`); decision 14 records the values.
