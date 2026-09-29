// Does the launcher frontend stay inside its design system? (roadmap L1.1)
//
// Scans src/ for the things docs/design/DESIGN_SYSTEM.md rules out, so they
// cannot drift back one class at a time: colour literals outside the token
// files, sizes and tracking off the scale, glows, gradients, pointer-following
// light and canvas animation.
//
//   node scripts/check-design.mjs
//
// Exits non-zero, listing every violation with its file and line.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

/** Files that define tokens and so may contain colour literals. */
const TOKEN_FILES = new Set(['src/styles/themes.ts', 'src/styles/qor.css']);

const RULES = [
  {
    name: 'Colours come from tokens, not literals',
    test: (file) => !TOKEN_FILES.has(file),
    pattern: /#[0-9a-fA-F]{3,8}\b|rgba?\(/,
  },
  {
    name: 'Font sizes come from the type scale (text-micro to text-figure)',
    test: (file) => file.endsWith('.tsx') || file.endsWith('.ts'),
    pattern: /\btext-\[\d+(\.\d+)?(px|rem|em)\]/,
  },
  {
    name: 'Letter-spacing comes from the tracking scale',
    test: (file) => file.endsWith('.tsx') || file.endsWith('.ts'),
    pattern: /\btracking-\[/,
  },
  {
    name: 'No glows or shadows',
    test: () => true,
    pattern: /box-shadow|drop-shadow|\bshadow-(?!none)|textShadow|text-shadow/,
  },
  {
    name: 'No gradients',
    test: () => true,
    pattern: /(linear|radial|conic)-gradient|bg-gradient-|createRadialGradient|createLinearGradient/,
  },
  {
    name: 'No light or effects that follow the pointer',
    test: () => true,
    pattern: /onPointerMove|pointermove|--px\b|--py\b|aura/,
  },
  {
    name: 'No canvas or frame-loop animation',
    test: () => true,
    pattern: /getContext\(|requestAnimationFrame/,
  },
  {
    name: 'No endlessly looping decorative animation',
    test: (file) => file.endsWith('.css'),
    pattern: /\binfinite\b/,
  },
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(entry.name) ? [path] : [];
  });
}

/** Strip comments so prose that names a ruled-out effect is not a violation. */
function code(text, file) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let out = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!file.endsWith('.css')) out = out.replace(/(^|[^:'"`])\/\/.*$/gm, (m, lead) => lead + blank(m.slice(lead.length)));
  return out;
}

const violations = [];
// src/qfx/ is exempt from the canvas and pointer rules, and ONLY those.
//
// The design system governs the chrome; QFX governs the canvas. Layer one is a
// GPU canvas with a frame loop and a pointer-reactive field, so it needs the
// four tokens the rules below forbid: getContext, requestAnimationFrame,
// pointermove and onPointerMove.
//
// Layer two is the DRC-369 asset card, which leans towards the pointer and so
// needs the pointer rule too. The owner widened the carve-out to it on
// 2026-09-22: one directory still, the same two rules still, a surface rather
// than only the backdrop.
//
// This is narrower than it looks, and it is not a relaxation. The chrome's rules
// still apply to every component and view -- the card has no gradient, shadow or
// glow, because those rules are not exempt here. The exempt directory carries
// STRICTER obligations that the chrome does not: a contrast guarantee the chrome
// enforces over it (scripts/check-contrast.mjs), every run of text on it measured
// as painted (scripts/check-readability.mjs), a frame-time budget that stops the
// canvas, and reduced motion forcing it still. Widening this beyond src/qfx/, or
// exempting a rule other than these two, is a different decision.
const QFX = 'src/qfx/';
const QFX_EXEMPT = new Set([
  'No light or effects that follow the pointer',
  'No canvas or frame-loop animation',
]);

// src/qfx/ceremony/ is exempt from the glow, gradient and looping rules, and
// ONLY those. The owner decided it on 2026-09-28, as a decision of its own,
// for the intro splash, the first-run animation, the glowing notification that
// opens the tutorial, and the tutorial: moments, not chrome. Every other rule
// holds there, and the canvas and pointer exemptions above do NOT extend to it.
// Its obligations: reduced motion stills it all, and its text is measured as
// painted by check-readability.mjs like everything else. Widening this is a
// different decision (docs/GATES.toml, change log of 2026-09-28).
const CEREMONY = 'src/qfx/ceremony/';
const CEREMONY_EXEMPT = new Set([
  'No glows or shadows',
  'No gradients',
  'No endlessly looping decorative animation',
]);

for (const path of walk(src)) {
  const file = relative(root, path).replaceAll('\\', '/');
  const lines = code(readFileSync(path, 'utf8'), file).split('\n');
  for (const rule of RULES) {
    if (!rule.test(file)) continue;
    if (file.startsWith(CEREMONY)) {
      if (CEREMONY_EXEMPT.has(rule.name)) continue;
    } else if (file.startsWith(QFX) && QFX_EXEMPT.has(rule.name)) continue;
    lines.forEach((line, i) => {
      if (rule.pattern.test(line)) violations.push({ rule: rule.name, where: `${file}:${i + 1}`, line: line.trim() });
    });
  }
}

for (const rule of RULES) {
  const hits = violations.filter((v) => v.rule === rule.name);
  console.log(`${hits.length ? 'FAIL' : 'PASS'}  ${rule.name}`);
  for (const hit of hits) console.log(`        ${hit.where}  ${hit.line}`);
}
const failed = RULES.filter((rule) => violations.some((v) => v.rule === rule.name)).length;
console.log(`RESULT: ${RULES.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
