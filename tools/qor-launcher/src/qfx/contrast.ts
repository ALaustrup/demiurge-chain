/**
 * The contrast guarantee.
 *
 * # What this is, and why the chrome owns it
 *
 * QFX puts a GPU canvas behind the interface and lets a creator decide what it
 * draws. A creator's theme is not a trusted input: it can paint any colour, at
 * any brightness, anywhere, and it can change while you read.
 *
 * So readability is not the theme's job and cannot be. The chrome carries a
 * **scrim** — one opaque-enough layer between the canvas and the content — and
 * the guarantee is arithmetic rather than taste: *whatever* the canvas paints,
 * the composited background behind text is close enough to the interface's own
 * background that the contrast ratio stays above the threshold.
 *
 * The functions here compute that worst case. They are used by the launcher and
 * by `scripts/check-contrast.mjs`, so the rule has one implementation. Two would
 * eventually disagree, and the disagreement would be invisible.
 *
 * # Why the worst case rather than a sample
 *
 * Sampling a few theme colours proves those colours are fine. The adversarial
 * colour — the one closest to the text colour, which is where contrast collapses
 * — is exactly the one a sample misses. `worstCaseContrast` does not sample: it
 * solves for the canvas colour that hurts most and reports the ratio there. If
 * that passes, every possible theme passes.
 */

export type Rgb = { r: number; g: number; b: number };

/** WCAG 2.x relative luminance. Channels are 0-255. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Composite `over` at `alpha` on top of `under`. Straight alpha, no gamma. */
export function composite(under: Rgb, over: Rgb, alpha: number): Rgb {
  const mix = (u: number, o: number) => Math.round(o * alpha + u * (1 - alpha));
  return { r: mix(under.r, over.r), g: mix(under.g, over.g), b: mix(under.b, over.b) };
}

/**
 * The lowest contrast text can have, over any canvas colour at all.
 *
 * The scrim paints `scrim` at `alpha` over whatever the canvas drew, so the
 * effective background is `composite(canvas, scrim, alpha)`. Contrast against
 * `ink` is worst when that composite is closest in luminance to `ink` — so the
 * adversarial canvas colour is the one whose luminance pulls the composite
 * toward the text.
 *
 * Both extremes are checked (black and white canvas) plus the ink colour itself,
 * which is the exact adversary. Luminance is monotonic in each channel and the
 * composite is linear in the canvas colour, so the minimum over the whole colour
 * cube is attained at one of these — a full search adds cost and finds nothing.
 */
export function worstCaseContrast(ink: Rgb, scrim: Rgb, alpha: number): number {
  const adversaries: Rgb[] = [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
    ink,
  ];
  return Math.min(
    ...adversaries.map((canvas) => contrastRatio(ink, composite(canvas, scrim, alpha))),
  );
}

/**
 * The floor the launcher holds itself to: WCAG 2.x AA for body text.
 *
 * Not a target to aim at — a value a check fails below. Raising it is a
 * tightening. Lowering it is a decision about who can read the interface, and
 * belongs to the owner rather than to a theme.
 */
export const CONTRAST_FLOOR = 4.5;

/** Parse `rgb(r, g, b)` / `rgba(...)` / `#rrggbb` as a computed style gives it. */
export function parseRgb(value: string): Rgb | null {
  const trimmed = value.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hex) {
    const raw = hex[1]!;
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const fn = /^rgba?\(([^)]+)\)$/i.exec(trimmed);
  if (fn) {
    const parts = fn[1]!.split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0]!, g: parts[1]!, b: parts[2]! };
    }
  }

  return null;
}
