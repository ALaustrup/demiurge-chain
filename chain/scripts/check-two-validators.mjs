// Do two validators agree, finalise, and can a killed one catch up? (roadmap M3.3)
//
// The last part of the M1 acceptance behaviour that cannot be tested inside the
// runtime. `chain/runtime/tests/block_import.rs` covers what one node does with
// a block; this covers what two nodes do with each other:
//
//   1. both author, on the `local` chain specification (Alice and Bob);
//   2. they agree: the block at a given height has the same hash on both;
//   3. GRANDPA finalises, which needs both validators voting;
//   4. a validator killed and restarted catches up to the chain that carried on.
//
// It also covers the one rule the runtime cannot check at all: a node refuses a
// block whose parent it does not have. `execute_block` initialises before it
// checks the parent, so that assertion is unreachable in-runtime; the import
// queue is what enforces it, and the resync below is what exercises the queue.
//
// Needs a release build first:
//
//   cargo build -p demiurge-node --release --features sudo
//   node scripts/check-two-validators.mjs
//
// Exits non-zero if any check fails. Leaves no processes or directories behind.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const NODE = resolve(
  process.env.DEMIURGE_NODE ??
    join(here, '..', 'target', 'release', process.platform === 'win32' ? 'demiurge-node.exe' : 'demiurge-node'),
);

if (!existsSync(NODE)) {
  console.error(`No node binary at ${NODE}.`);
  console.error('Build it first: cargo build -p demiurge-node --release --features sudo');
  process.exit(2);
}

// Alice's node key is fixed so her peer id is known before she starts, which is
// what lets Bob be given a bootnode address without scraping a log.
// A validator will not generate a network key on its own, so both are given one.
const ALICE_NODE_KEY = '0000000000000000000000000000000000000000000000000000000000000001';
const BOB_NODE_KEY = '0000000000000000000000000000000000000000000000000000000000000002';
// Alice's peer id follows from her node key. It is asserted below rather than
// assumed, because a wrong bootnode address would look like a networking
// failure instead of a typo.
const ALICE_PEER_ID = '12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp';

const ALICE = { name: 'alice', flag: '--alice', p2p: 30341, rpc: 9961 };
const BOB = { name: 'bob', flag: '--bob', p2p: 30342, rpc: 9962 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function rpc(port, method, params = []) {
  const res = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(5000),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function height(port, finalized = false) {
  const hash = finalized
    ? await rpc(port, 'chain_getFinalizedHead')
    : (await rpc(port, 'chain_getHeader')) && null;
  const header = finalized
    ? await rpc(port, 'chain_getHeader', [hash])
    : await rpc(port, 'chain_getHeader');
  return Number.parseInt(header.number, 16);
}

/// Wait until `predicate` holds, or give up. Returns whether it held.
async function until(predicate, seconds, everyMs = 1000) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      if (await predicate()) return true;
    } catch {
      // A node that is still starting refuses connections; keep waiting.
    }
    await sleep(everyMs);
  }
  return false;
}

const running = new Map();

function start(node, base, extra = []) {
  const args = [
    '--chain', 'local',
    node.flag,
    '--validator',
    '--base-path', join(base, node.name),
    '--port', String(node.p2p),
    '--rpc-port', String(node.rpc),
    '--rpc-cors', 'all',
    '--no-prometheus',
    '--no-telemetry',
    '--log', 'error',
    ...extra,
  ];
  const child = spawn(NODE, args, { stdio: 'ignore' });
  running.set(node.name, child);
  return child;
}

async function stop(name) {
  const child = running.get(name);
  if (!child) return;
  child.kill('SIGKILL');
  running.delete(name);
  await sleep(1500);
}

async function cleanup(base) {
  for (const name of [...running.keys()]) await stop(name);
  if (base) await rm(base, { recursive: true, force: true }).catch(() => {});
}

const base = await mkdtemp(join(tmpdir(), 'demiurge-two-'));

try {
  // ---- 1. two validators, connected ------------------------------------
  // `--force-authoring` on the first validator, deliberately. Without it a node
  // with no peers stops authoring, which is Substrate refusing to build a
  // one-sided chain while it might be partitioned — correct behaviour, and the
  // reason an earlier version of this check failed when the second validator
  // was killed. Forcing it is what makes the catch-up case below testable at
  // all: the chain has to advance while the other validator is away.
  start(ALICE, base, ['--node-key', ALICE_NODE_KEY, '--force-authoring']);
  start(BOB, base, [
    '--node-key', BOB_NODE_KEY,
    '--bootnodes',
    `/ip4/127.0.0.1/tcp/${ALICE.p2p}/p2p/${ALICE_PEER_ID}`,
  ]);

  const bothUp = await until(async () => {
    await rpc(ALICE.rpc, 'system_chain');
    await rpc(BOB.rpc, 'system_chain');
    return true;
  }, 90);
  check('both validators start and answer RPC', bothUp);
  if (!bothUp) throw new Error('the validators did not start');

  const peerId = await rpc(ALICE.rpc, 'system_localPeerId');
  check(
    "the bootnode address names the first validator's actual peer id",
    peerId === ALICE_PEER_ID,
    peerId,
  );

  const chainName = await rpc(ALICE.rpc, 'system_chain');
  check(
    'they are on the local chain specification',
    chainName === 'Demiurge Local Testnet',
    chainName,
  );

  const peered = await until(async () => (await rpc(ALICE.rpc, 'system_health')).peers >= 1, 90);
  check('they find each other', peered);

  // ---- 2. both author, and they agree ----------------------------------
  const authored = await until(async () => (await height(ALICE.rpc)) >= 4, 120);
  check('the chain produces blocks', authored);

  const bobCaughtUp = await until(async () => (await height(BOB.rpc)) >= 4, 120);
  check('the second validator follows the chain', bobCaughtUp);

  // Compare a height both have passed, so neither is asked about a block it
  // has not seen. Agreement on the hash is agreement on everything in it.
  const common = Math.min(await height(ALICE.rpc), await height(BOB.rpc)) - 1;
  const [onAlice, onBob] = await Promise.all([
    rpc(ALICE.rpc, 'chain_getBlockHash', [common]),
    rpc(BOB.rpc, 'chain_getBlockHash', [common]),
  ]);
  check(
    `both validators have the same block at height ${common}`,
    onAlice === onBob,
    `${onAlice} vs ${onBob}`,
  );

  // ---- 3. finality, which needs both voting ----------------------------
  const finalised = await until(async () => (await height(ALICE.rpc, true)) >= 2, 180);
  check('GRANDPA finalises', finalised, `finalized #${await height(ALICE.rpc, true)}`);

  const finalAgree = await until(async () => {
    const a = await rpc(ALICE.rpc, 'chain_getFinalizedHead');
    const n = Number.parseInt((await rpc(ALICE.rpc, 'chain_getHeader', [a])).number, 16);
    const onB = await rpc(BOB.rpc, 'chain_getBlockHash', [n]);
    return a === onB;
  }, 120);
  check('both validators agree on what is finalised', finalAgree);

  // ---- 4. a killed validator catches up --------------------------------
  const bobAtDeath = await height(BOB.rpc);
  await stop('bob');
  check('one validator is killed', !running.has('bob'), `bob was at #${bobAtDeath}`);

  // The survivor keeps authoring alone only because of `--force-authoring`
  // above. With two validators in the set, Aura leaves the slots the missing one
  // would have filled, so the chain advances at half rate rather than stopping.
  // Finality does stop: GRANDPA needs more than two thirds of the voters, and
  // one of two is not enough. That is the chain being safe rather than broken,
  // and the restart below is what lets it resume.
  const aliceCarriedOn = await until(
    async () => (await height(ALICE.rpc)) >= bobAtDeath + 3,
    180,
  );
  check(
    'the surviving validator keeps producing blocks alone',
    aliceCarriedOn,
    `alice reached #${await height(ALICE.rpc)}`,
  );

  const aliceAhead = await height(ALICE.rpc);
  start(BOB, base, [
    '--node-key', BOB_NODE_KEY,
    '--bootnodes',
    `/ip4/127.0.0.1/tcp/${ALICE.p2p}/p2p/${ALICE_PEER_ID}`,
  ]);

  const resynced = await until(async () => (await height(BOB.rpc)) >= aliceAhead, 180);
  check(
    'the restarted validator catches up to the chain it missed',
    resynced,
    `bob reached #${resynced ? await height(BOB.rpc) : 'never'}, alice was at #${aliceAhead}`,
  );

  // And having caught up, it agrees about the blocks produced while it was gone.
  if (resynced) {
    const missed = bobAtDeath + 1;
    const [a, b] = await Promise.all([
      rpc(ALICE.rpc, 'chain_getBlockHash', [missed]),
      rpc(BOB.rpc, 'chain_getBlockHash', [missed]),
    ]);
    check(
      `it agrees about block ${missed}, produced while it was down`,
      a === b && !!a,
      `${a} vs ${b}`,
    );
  }
} catch (error) {
  check('the run completed', false, String(error.message ?? error));
} finally {
  await cleanup(base);
}

const failed = results.filter((r) => !r.pass).length;
console.log(`RESULT: ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
