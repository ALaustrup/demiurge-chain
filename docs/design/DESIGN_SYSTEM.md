# Design system

How every Demiurge surface looks and behaves. The QOR Launcher (`tools/qor-launcher`) is the reference
implementation: its tokens live in `src/styles/themes.ts` and `src/styles/qor.css`, and its components
in `src/components/ui` and `src/views/parts.tsx`. The web surfaces of ADR-011 adopt the same tokens,
scales and rules when they are built.

When this document and the launcher disagree, fix one of them in the same change.

## 1. Position

Professional and restrained, dark and confident. Typographic hierarchy and generous spacing do the
work, not decoration (`docs/DIRECTION.md` §5). **When in doubt, subtract.**

Ruled out on every surface:
- glows, including glowing status indicators and focus rings;
- light or effects that follow the pointer;
- particle fields, canvas backdrops and other animated backgrounds;
- gradients used as colour, including vignettes and gradient progress bars;
- neon colour and cyberpunk styling;
- animation that loops for decoration. A loading spinner is not decoration.

`tools/qor-launcher/scripts/check-design.mjs` fails on colour literals outside the token files, sizes
or tracking off the scales, shadows, gradients, pointer-following effects and canvas animation.

**One exception, and its rule** (ADR-051, accepted 22 September 2026): **the design system governs the default
theme and the chrome; QFX governs the canvas; the default must still pass `check-design.mjs` unchanged.** QFX's
surfaces, in `src/qfx/` alone, may move and answer the pointer, which is why the check exempts that one directory
from its canvas and pointer rules and from nothing else. Everything a person reads, presses or trusts is chrome,
and the list above applies to it without exception. The dreamlike look is a creator's choice, never the default.

**Widened once, by the owner, on 22 September 2026:** the exempt directory holds the canvas backdrop *and* the
DRC-369 asset card, which leans towards the pointer. **The two exempt rules did not change**, so the card carries
no gradient, shadow or glow. A holographic sheen is a gradient; the way to have one under this rule is for the one
canvas already behind the interface to show through the card, not for the card to paint its own. What a QFX
surface may not cost is measured rather than promised: text over it is held to AA as it is painted
(`scripts/check-readability.mjs`), and reduced motion makes it still, not slower.

**A second exception, the ceremony, decided by the owner on 28 September 2026 as a decision of its own:**
`src/qfx/ceremony/` may glow, use gradients and loop an animation, and nothing else changes for it. It holds the
moments that are meant to feel like an arrival rather than a tool: the intro splash on each open, the first-run
animation after an install or update, the notification with a neochrome halo that opens the tutorial, and the
tutorial. Every other rule applies there, including colours from tokens (the halo's chrome is the theme's own ink
and accent); the canvas and pointer exemptions do **not** extend to it; and the chrome outside it, the claim bubble
and the information icon included, stays under the full list. Its obligations are the QFX ones: its text is
measured as painted, and reduced motion, in the launcher or the operating system, stills it or skips it.

## 2. Colour

**One accent, one structural counter, three status colours. Nothing else is tinted.** The accent
means "this one": live, selected, or about to be pressed. It is never spent on ornament.

| Token | Utility | Role |
| --- | --- | --- |
| `--void` | `bg-void` | Deepest ground: title bar, navigation rail |
| `--base` | `bg-base` | Application background |
| `--surface` | `bg-surface` | Panel fill |
| `--raised` | `bg-raised` | Hover fills, raised controls |
| `--well` | `bg-well` | Inputs and inset areas, sunk below the surface |
| `--accent`, `--accent-bright`, `--accent-dim` | `text-accent`, `bg-accent`, … | The single meaningful colour; bright for hover, dim for borders |
| `--counter` | `bg-counter` | Structure and danger edges, such as the close button's hover |
| `--ink`, `--ink-body`, `--ink-muted`, `--ink-faint` | `text-ink`, … | Text, brightest to faintest |
| `--edge`, `--edge-soft` | `border-edge`, … | Hairlines |
| `--color-ok`, `--color-warn`, `--color-bad` | `text-ok`, `border-warn`, `bg-bad/5`, … | Success, caution, failure. Never decorative |

Status colours are the same in every theme. A status message uses a 2px left border in the status
colour, a 5% tint of it, and text in it (for example `border-l-2 border-bad bg-bad/5 text-bad`).

**A status colour or a theme's accent used as text reads 4.5:1 too, over any backdrop.** Neither is in the ink
ramp, so `check-contrast.mjs` never covered them; `check-readability.mjs` does. On 22 September 2026 three fell
short over a bright backdrop, each by a few HSL lightness points and each raised by only that much, hue and
saturation kept: `--color-bad` from `#cf6679` to `#d57889`, sanguine's accent from `#FF2D55` to `#FF3D62`, and
numen's from `#A855F7` to `#B166F8`. Dark text on an accent fill only gains.

**Every ink step reads at 4.5:1 or better, down to `--ink-faint`, in every theme:** on every background
token (`--void`, `--base`, `--surface`, `--raised`, `--well`), and over any colour the QFX backdrop could
paint beneath the chrome's scrim. `--ink-faint` failed the first of those in all five themes, at 2.87 to
3.26:1 on `--raised`, until 22 September 2026, when it was raised toward `--ink-muted` just far enough to
pass with margin. It still sits clearly below `--ink-muted`, so the ramp keeps four steps. After
`npm run build`, `tools/qor-launcher/scripts/check-contrast.mjs` applies each theme through the app and
checks all of it.

**And every run of text, as it is painted, reads at AA on every screen** — the Gate's three states and every
surface on the rail, in every theme, with the backdrop off and with a hostile backdrop in the canvas's place.
`tools/qor-launcher/scripts/check-readability.mjs` measures each run against the pixels actually behind it, and
the glyphs actually drawn, so an overlay, a stacking mistake or a colour outside the ink ramp is caught where
the token checks cannot see it.

### Themes

A theme is a set of the tokens above (`src/styles/themes.ts`), applied as one stylesheet rule on
`:root[data-theme]`. Five exist: Architect (the default: ember on carbon), Abyss, Sanguine, Veridian and
Numen.

**Decided by the owner, 22 September 2026:** Veridian (`#3DFF88`) and Abyss (`#22D3EE`), which lean neon,
become QFX themes and are never the default. They move when QFX's theme package exists (P2.5); until then
they stay in this list as they are. The copy for Veridian ("The terminal you were warned about") and Sanguine
("Unsettling on purpose") is not restrained, and is still recorded here and in the reconciliation report (§7).

## 3. Type

System fonts only, so every surface renders correctly offline and on first run:
- display and body: Segoe UI Variable, then the platform's UI face;
- numbers and addresses: Cascadia Mono, SF Mono or Consolas.

### Scale

Every size is one of eight steps. Arbitrary sizes (`text-[13px]`) are not used.

| Step | Size | Utility | Used for |
| --- | --- | --- | --- |
| micro | 10px | `text-micro` | Eyebrows, badges, dense metadata |
| caption | 11px | `text-caption` | Hints, secondary metadata, navigation labels |
| ui | 12px | `text-ui` | Controls, list text, most interface copy |
| body | 13px | `text-body` | Reading text, and the document default |
| title | 15px | `text-title` | Panel and dialog titles, key figures in a summary |
| heading | 18px | `text-heading` | View and Gate headings |
| display | 24px | `text-display` | The Nexus masthead, headline figures |
| figure | 38px | `text-figure` | The one balance a view exists to show |

### Roles

| Class | What it is |
| --- | --- |
| `.eyebrow` | Uppercase label above a heading or field: micro, semibold, eyebrow tracking, muted ink |
| `.heading` | Display face, semibold, uppercase, heading tracking, full ink. Size comes from the scale |
| `.numeric` | Mono with tabular figures, for amounts, addresses, block numbers and counts |

### Tracking

| Token | Value | Used for |
| --- | --- | --- |
| `tracking-heading` | 0.06em | Headings (built into `.heading`) |
| `tracking-label` | 0.1em | Uppercase controls and labels: buttons, navigation, theme names |
| `tracking-eyebrow` | 0.18em | Eyebrows and the wordmark (built into `.eyebrow`) |

`.numeric` tightens to -0.01em. The readable-text setting overrides tracking (§7).

## 4. Space and shape

Spacing uses Tailwind's 0.25rem unit, which the density setting rescales.

| Context | Spacing |
| --- | --- |
| View gutter | `px-8`; view header `px-8 py-6` |
| Dialog: Gate card, fault screen | `p-8` |
| Panel | `p-6` |
| Compact panel: stat, tile, notice | `p-5` |
| List row | `px-4 py-3` |
| Between panels | `gap-4`; between tiles `gap-3`; between sections `mb-9` |

**Radius is 2px** (`rounded-qor`, `--radius-qor`) on every panel, control and field. The exceptions are
the status dot and the switch, which are circles.

## 5. Components

| Component | Where | Notes |
| --- | --- | --- |
| Surface | `components/ui/Surface.tsx`, `.surface` | Translucent panel with blur, hairline, 2px radius. `interactive` answers hover with a raised fill and an accent-dim border. |
| Panel | `views/parts.tsx` | A Surface with corner marks; a button when clickable |
| Corner marks | `.cut` | Two 9px accent corners at half opacity; full opacity on hover when interactive. Instrumentation for a selected or actionable panel. |
| Glass | `.glass`, `.glass-solid` | Translucent and solid panel fills for dialogs and toasts |
| Button | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger` | ui size, label tracking, uppercase. One primary per decision. |
| Field | `.field`, `.field-invalid` | Well fill; accent border on focus; bad border when invalid |
| Status dot | `.dot-ok`, `.dot-warn`, `.dot-bad` | 6px circle, flat colour, never animated |
| Progress rail | `.rail`, `.rail-fill` | 2px track, solid accent fill |
| View header | `ViewHeader` in `views/parts.tsx` | Eyebrow in accent, heading, one line of body |
| Stat | `Stat` in `views/parts.tsx` | Eyebrow, figure, unit, detail |
| Toast | `App.tsx` | Solid glass, 2px status border, bottom centre; errors 8 seconds, successes 4 |

## 6. Motion

Motion confirms a change; it never decorates a resting screen.
- **Entrance:** `animate-rise` (6px, 420ms), and `stagger` for grids at 38ms per item.
- **View change:** a 160ms cross-fade.
- **Controls:** colour and border transitions of 150 to 260ms, and a 1px press on buttons.
- **Easing:** `--ease-expo` throughout.
- **Loading:** a spinning icon, only while something is actually in progress.

No motion in the chrome runs while the interface is idle. The motion setting (§7) governs all of it, including
the animations framer-motion drives from JavaScript.

**The QFX canvas is the exception, and says so** (ADR-051, accepted 22 September 2026): it may move while the
interface is idle, behind the chrome's scrim. Settings → Accessibility → Ambience governs it — Live, Still or Off
— and Still is its pause. Reduced motion forces Still, maximum contrast removes it, and Off removes it and the
scrim together.

**The layers are fixed, and the order is the guarantee: the canvas, then the scrim, then the interface.** The
interface is `.qfx-interface` in `qor.css`, lifted above the scrim, with no background of its own, so the page's
`--base` shows when the backdrop is off and the scrim's when it is on. Until 22 September 2026 the order was set on
`#qor-root`, which holds all three, so it lifted all three together: the interface painted beneath the canvas and
the scrim, and most of the launcher sat under `--base` at 90%. Every token check passed, because a token check
assumes the order. `tools/qor-launcher/scripts/check-readability.mjs` measures the painted result instead.

## 7. Accessibility settings

Written by `src/lib/a11y.ts` as attributes and properties on `<html>`, so components know nothing
about them.

| Setting | Effect |
| --- | --- |
| Scale | Browser-style zoom of the whole interface, 0.8 to 1.6 |
| Density | Rescales the spacing unit, 0.85 to 1.5 |
| Contrast: normal, high, maximum | Raises the dim end of the ink and edge ramps. Maximum also makes panels opaque. |
| Motion: system, full, reduced | System follows the operating system; full and reduced override it |
| Bold focus | 3px focus ring in bright accent |
| Reduce transparency | Opaque panels, no blur |
| Underline links | Link-like controls underlined, not only coloured |
| Readable text | WCAG 1.4.12 spacing, sentence-case headings, a 68-character line cap |
| Ambience: off, still, live | The QFX backdrop. Live by default at a restrained amplitude; Still is one frame and its pause; Off removes it and its scrim. Reduced motion forces Still |

The overrides sit outside every cascade layer, so no component class can undo them. The reduced-motion
override is `!important` inside the base layer, which outranks every later layer. `qor.css` explains
both. After `npm run build`, `tools/qor-launcher/scripts/check-accessibility.mjs` confirms each
setting in a headless browser.

## 8. Conventions

- **Amounts** appear only as the host formats them, in CGT. The interface never computes, rounds or
  converts an amount, and never shows a raw Spark count.
- **Unknown value:** an em dash (`—`). **Loading or pending:** an ellipsis (`…`).
- **Unbuilt surfaces** (Library, Social, Mesh) show what they will do and what they are waiting on, never
  mock content.
- **Errors** say what to do next in plain words (`src/lib/ipc.ts`, `FRIENDLY`).
- **Irreversible actions** are two-stage: compose, then confirm against a summary. Signatures are then
  approved in a dialog the host draws (roadmap L1.4).
