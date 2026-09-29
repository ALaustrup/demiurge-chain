// Run the host suite many times and capture the NAME of anything that fails.
//
// Why this exists. A host-test failure was seen once, in one run out of eight,
// and the name of the failing test was not captured — so there was nothing to
// investigate, only a rumour. `cargo test` does print the name, in a `failures:`
// block at the end; what was missing was a run that kept the output of the run
// that failed. This keeps it.
//
//   node scripts/repeat-host-tests.mjs [runs]     # default 50
//
// A failing run's full output is written to scripts/.flake/run-<n>.log and the
// failing test names are printed. Passing runs leave nothing behind. Exits
// non-zero if any run failed, so it can be used as a check.
//
// It reports an upper bound on the failure rate when nothing fails, because
// "no failures in N runs" is not the same as "there is no flake": with 50 clean
// runs the rate is under about 6% with 95% confidence, and a rarer flake, or one
// that needs a loaded machine, a cold cache or a different operating system, is
// not ruled out by any number of clean runs here.

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const crate = join(here, '..', 'src-tauri');
const outDir = join(here, '.flake');

const runs = Number.parseInt(process.argv[2] ?? '50', 10);
if (!Number.isInteger(runs) || runs < 1) {
  console.error(`Not a run count: ${process.argv[2]}`);
  process.exit(2);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Every test name the harness reported as failing, across every run.
const failedNames = new Map();
let failures = 0;

for (let i = 1; i <= runs; i += 1) {
  const r = spawnSync('cargo', ['test', '--locked'], {
    cwd: crate,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`;

  if (r.status === 0) {
    process.stdout.write('.');
    continue;
  }

  failures += 1;
  const log = join(outDir, `run-${i}.log`);
  writeFileSync(log, output, 'utf8');

  // The harness lists each failing test by name under a `failures:` heading.
  // Take the names, not the whole block, so repeated failures group together.
  const names = [...output.matchAll(/^ {4}([\w:]+)$/gm)].map((m) => m[1]);
  for (const n of names) failedNames.set(n, (failedNames.get(n) ?? 0) + 1);

  process.stdout.write('\n');
  console.log(`FAIL  run ${i}: ${names.length ? names.join(', ') : 'no test name in the output'}`);
  console.log(`      full output: ${log}`);
}

console.log(`\nRUNS=${runs} FAILURES=${failures}`);

if (failures === 0) {
  // One-sided 95% bound: the largest p for which P(0 failures in N) >= 0.05.
  const bound = 1 - 0.05 ** (1 / runs);
  console.log(
    `No failures. That bounds the rate at about ${(bound * 100).toFixed(1)}% or less, ` +
      `with 95% confidence. It does not rule out a rarer flake, or one that needs a ` +
      `loaded machine, a cold cache or another operating system.`,
  );
  process.exit(0);
}

console.log('Failing tests, by how many runs each appeared in:');
for (const [name, n] of [...failedNames].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}x  ${name}`);
}
process.exit(1);
