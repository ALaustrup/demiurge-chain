// Build the qontrol-git helper and put it where the bundler takes it from.
//
// An installed launcher must be able to commit (P1.2, and the owner's decision
// 7 in docs/blueprints/qontrol.md), so the helper ships inside the installer as
// a Tauri sidecar. Tauri takes a sidecar from `src-tauri/<path>-<target triple>`
// and installs it beside the launcher as `<path>`, which is the second place
// `sidecar::binary()` looks.
//
// The sidecar is declared in `src-tauri/tauri.bundle.conf.json`, not in
// `tauri.conf.json`, because tauri-build refuses to compile when a declared
// sidecar is missing: declared in the main file, a clean checkout's
// `cargo test` would fail until this script had run. `npm run app:build` runs
// this script and then passes that file with `--config`.
//
// It also copies libgit2's licence out of the exact source that was vendored
// into the helper. libgit2 is GPLv2 with a linking exception; the exception
// permits shipping it, and its terms must travel with the installer (the
// blueprint's risk 5). Taken from the crate the build used, so the notice
// always matches the code shipped.
//
//   node scripts/build-helper.mjs            release build, the default
//   node scripts/build-helper.mjs --debug    a debug build, for a quick check

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const helper = join(root, "qontrol-git");
const manifest = join(helper, "Cargo.toml");
const debug = process.argv.includes("--debug");
const profile = debug ? "debug" : "release";

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

// The triple the bundler will look for: the host's, unless one is given, as a
// cross-compiling packager does with TAURI_ENV_TARGET_TRIPLE.
const triple =
  process.env.TAURI_ENV_TARGET_TRIPLE ||
  run("rustc", ["-vV"])
    .split("\n")
    .find((line) => line.startsWith("host:"))
    ?.slice("host:".length)
    .trim();
if (!triple) {
  console.error("could not read the target triple from `rustc -vV`");
  process.exit(1);
}

const args = ["build", "--manifest-path", manifest, "--locked"];
if (!debug) args.push("--release");
if (process.env.TAURI_ENV_TARGET_TRIPLE) args.push("--target", triple);
execFileSync("cargo", args, { cwd: root, stdio: "inherit" });

const exe = triple.includes("windows") ? ".exe" : "";
const built = process.env.TAURI_ENV_TARGET_TRIPLE
  ? join(helper, "target", triple, profile, `qontrol-git${exe}`)
  : join(helper, "target", profile, `qontrol-git${exe}`);
if (!existsSync(built)) {
  console.error(`the helper was built but is not at ${built}`);
  process.exit(1);
}

const binaries = join(root, "src-tauri", "binaries");
mkdirSync(binaries, { recursive: true });
const placed = join(binaries, `qontrol-git-${triple}${exe}`);
copyFileSync(built, placed);

// libgit2's licence, from the crate this build vendored.
const metadata = JSON.parse(
  run("cargo", ["metadata", "--manifest-path", manifest, "--format-version", "1", "--locked"]),
);
const sys = metadata.packages.find((p) => p.name === "libgit2-sys");
if (!sys) {
  console.error("libgit2-sys is not in the helper's dependency graph; the licence step needs revisiting");
  process.exit(1);
}
const copying = join(dirname(sys.manifest_path), "libgit2", "COPYING");
if (!existsSync(copying) || !readFileSync(copying, "utf8").includes("LINKING EXCEPTION")) {
  console.error(`libgit2's licence was not found, or has no linking exception, at ${copying}`);
  process.exit(1);
}
const licences = join(root, "src-tauri", "licenses");
mkdirSync(licences, { recursive: true });
copyFileSync(copying, join(licences, "libgit2-COPYING.txt"));

console.log(`qontrol-git (${profile}, ${triple}) -> ${placed}`);
console.log(`libgit2 (libgit2-sys ${sys.version}) licence -> ${join(licences, "libgit2-COPYING.txt")}`);
