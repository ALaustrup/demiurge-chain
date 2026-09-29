/**
 * Accessibility and comfort settings.
 *
 * # Why this is core rather than a preferences afterthought
 *
 * Retrofitting accessibility means auditing every component you already shipped.
 * Building it into the token layer means every component written afterwards
 * inherits it for free, and the settings become the *same mechanism* that serves
 * ordinary preference: text size, density and contrast are comfort controls for
 * most people and access requirements for some. There is no reason to build
 * those twice.
 *
 * Everything here is a CSS custom property or a data attribute on `<html>`, so a
 * change is one repaint, no re-render, and no component needs to know.
 *
 * # On scaling
 *
 * `zoom` scales layout the way the browser's own zoom does: padding, borders and
 * fixed pixel sizes all move together and the layout reflows correctly. A CSS
 * `transform` would scale the painted result instead, blurring text and leaving
 * hit targets in the wrong place. Tailwind's `--spacing` base unit drives every
 * spacing utility in the app, so density is a single variable.
 *
 * # On screen readers
 *
 * There is no bespoke speech engine here, deliberately. Blind users already own
 * screen readers they are expert in, and the useful work is making the interface
 * legible to those: real landmarks, honest labels, managed focus, and live
 * regions that announce change. That is handled in the components, and
 * `announce()` below is the shared channel for it.
 */

export type Contrast = 'normal' | 'high' | 'maximum';
export type Motion = 'system' | 'full' | 'reduced';

/**
 * How much life the backdrop has (QFX layer one).
 *
 * It lives here, with the comfort settings, rather than in a theme, because it
 * is the same kind of control: a preference for most people and an access
 * requirement for some. A theme decides what the backdrop looks like. This
 * decides whether it moves at all, and the theme cannot overrule it.
 *
 * - `off`   no canvas at all
 * - `still` the canvas draws one frame and stops
 * - `live`  the canvas animates, at a restrained amplitude
 */
export type Ambience = 'off' | 'still' | 'live';

export interface A11ySettings {
  /** Overall interface scale, 0.8 to 1.6. */
  scale: number;
  /** Spacing multiplier, 0.85 to 1.5. 1 is the designed density. */
  density: number;
  contrast: Contrast;
  motion: Motion;
  /** Thicker, always-visible focus rings. */
  boldFocus: boolean;
  /** Replace translucent panels with solid fills. */
  reduceTransparency: boolean;
  /** Underline every link-like control, not only on hover. */
  underlineLinks: boolean;
  /** Dyslexia-friendlier spacing: looser letters, words and lines. */
  readableText: boolean;
  /** How much life the backdrop has. Reduced motion forces `still`. */
  ambience: Ambience;
}

export const DEFAULT_A11Y: A11ySettings = {
  scale: 1,
  density: 1,
  contrast: 'normal',
  motion: 'system',
  boldFocus: false,
  reduceTransparency: false,
  underlineLinks: false,
  readableText: false,
  // Live by default, because a still backdrop is indistinguishable from no
  // backdrop and nobody would discover the setting. Restrained amplitude is
  // what makes that defensible, not stillness.
  ambience: 'live',
};

export const SCALE_RANGE = { min: 0.8, max: 1.6, step: 0.05 };
export const DENSITY_RANGE = { min: 0.85, max: 1.5, step: 0.05 };

const STORAGE_KEY = 'qor.a11y';

/** Tailwind's base spacing unit. Every `p-*`, `gap-*` and `m-*` derives from it. */
const BASE_SPACING_REM = 0.25;

export function applyA11y(settings: A11ySettings): void {
  const root = document.documentElement;

  // Clamp rather than trust: a corrupt stored value must not make the interface
  // unusable in a way that hides the control needed to fix it.
  const scale = clamp(settings.scale, SCALE_RANGE.min, SCALE_RANGE.max);
  const density = clamp(settings.density, DENSITY_RANGE.min, DENSITY_RANGE.max);

  root.style.setProperty('--ui-scale', String(scale));
  root.style.setProperty('--spacing', `${BASE_SPACING_REM * density}rem`);

  root.setAttribute('data-contrast', settings.contrast);
  root.setAttribute('data-motion', settings.motion);
  root.toggleAttribute('data-bold-focus', settings.boldFocus);
  root.toggleAttribute('data-solid', settings.reduceTransparency);
  root.toggleAttribute('data-underline-links', settings.underlineLinks);
  root.toggleAttribute('data-readable', settings.readableText);

  // Reduced motion wins, always. A theme cannot reach this, and neither can the
  // ambience setting: asking for less motion and getting a moving backdrop is
  // the failure this ordering exists to prevent.
  root.setAttribute('data-ambience', effectiveAmbience(settings));

  save(settings);
}

export function loadA11y(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y };

    const parsed = JSON.parse(raw) as Partial<A11ySettings>;
    return { ...DEFAULT_A11Y, ...parsed };
  } catch {
    return { ...DEFAULT_A11Y };
  }
}

function save(settings: A11ySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A preference is never worth failing over.
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/* ─────────────────────────── screen reader channel ─────────────────────────*/

let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;

/**
 * Announce something to a screen reader.
 *
 * Visual users see a banner; without this, non-visual users get nothing at all
 * when a transfer settles or a claim is refused. `assertive` interrupts whatever
 * is being read and is reserved for errors and completed money movements.
 *
 * The regions are created once and reused. Clearing before writing forces a
 * fresh announcement even when the same text repeats, which screen readers
 * otherwise skip.
 */
export function announce(message: string, urgency: 'polite' | 'assertive' = 'polite'): void {
  const region = urgency === 'assertive' ? ensureAssertive() : ensurePolite();
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

function ensurePolite(): HTMLElement {
  politeRegion ??= createRegion('polite');
  return politeRegion;
}

function ensureAssertive(): HTMLElement {
  assertiveRegion ??= createRegion('assertive');
  return assertiveRegion;
}

function createRegion(urgency: 'polite' | 'assertive'): HTMLElement {
  const node = document.createElement('div');
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', urgency);
  node.setAttribute('aria-atomic', 'true');
  node.className = 'sr-only';
  document.body.appendChild(node);
  return node;
}


/**
 * What the canvas should actually do, after reduced motion has had its say.
 *
 * `reduced` forces `still` even when ambience asks for `live`. `system` defers
 * to the operating system's own preference. Exported because the canvas and the
 * checks both need the same answer, and two implementations of this rule would
 * eventually disagree.
 */
export function effectiveAmbience(settings: A11ySettings): Ambience {
  if (settings.ambience === 'off') return 'off';
  return wantsLessMotion(settings) ? 'still' : settings.ambience;
}

/**
 * Whether the person asked for less motion, in the launcher or, under `system`,
 * in the operating system. The splash, the first-run animation and the glowing
 * notification all ask this, so they agree with the backdrop.
 */
export function wantsLessMotion(settings: A11ySettings): boolean {
  return (
    settings.motion === 'reduced' ||
    (settings.motion === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true)
  );
}
