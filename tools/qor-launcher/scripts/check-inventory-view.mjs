// Does the Inventory show exactly the assets the chain holds for this account? (M4.1)
//
// The host's live test proves that `src-tauri/src/chain/assets.rs` reads a real
// chain correctly: a mint against a development node finalises and appears in
// the owner's enumeration, read from storage. That says nothing about what
// reaches the screen. This check covers the other half: it serves the built
// frontend in a real rendering engine, answers the `drc369_*` commands with a
// FIXTURE whose contents are known, opens the Inventory and reads back what was
// drawn.
//
// What it is for: for every asset, the project name, the content reference the
// chain holds NOW (not the one it was minted with, if it was revised), the
// commit it pins and whether it is permanent — each from the host and nothing
// else. Since the assets became cards (QFX layer two), the face carries identity
// and the close-up carries the rest, so this opens each card and reads that too.
// It also drives a trade (L4.4, L4.5): the menu opened by the keyboard and by the
// pointer's secondary button, the assets chosen, the warning before anything is
// sent, and what reaches the host.
// And after "Make permanent", the view must draw the chain's next answer,
// not flip a flag it believes: the host's second answer carries an asset the
// first did not, which an optimistic view cannot show.
//
// Like check-projects-view.mjs it deliberately opens no chain. Checking the view
// against the same storage the host reads would pass if both were wrong
// together.
//
// No dependencies beyond Node 22+ and an installed Edge or Chrome. Set
// BROWSER_PATH to use another Chromium-family browser.
//
//   npm run build
//   node scripts/check-inventory-view.mjs [dist directory, default ./dist]
//
// Exits non-zero if any check fails.
//
// Proven to fail, on 22 September 2026, before it was trusted, by three faults
// injected into the VIEW (a fault in the fixture's own values moves both sides
// of every assertion together and proves nothing; check-projects-view.mjs
// records how that was learnt):
//
//   1. Inventory.tsx drew the reference an asset was MINTED with in place of the
//      one it carries now.
//   2. After "Make permanent", Inventory.tsx flipped the asset to permanent in
//      its own state instead of asking the host again.
//   3. Inventory.tsx labelled every asset "Permanent" whatever the host said.
//
// Each made this check fail; the commit that added it records the counts.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
if (!existsSync(join(dist, 'index.html'))) {
  console.error(`No build at ${dist}. Run \`npm run build\` first.`);
  process.exit(2);
}

const BROWSER =
  process.env.BROWSER_PATH ??
  [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((p) => existsSync(p));

if (!BROWSER) {
  console.error('No Chromium-family browser found. Set BROWSER_PATH.');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The fixture. Every value is arbitrary and belongs to no real asset.
const ADDRESS = '5FixtureAddressForTheInventoryCheck0000000000000';
const ref = (byte, size) => ({ algo: 'BLAKE3-256', root: byte.repeat(32), size });

const FRESH = {
  collection: 4,
  item: 0,
  name: 'first-song',
  origin: ref('1f', 211),
  current: ref('1f', 211),
  commit: { kind: 'SHA-1', id: 'a1'.repeat(20) },
  revisable: true,
};
// Revised once, then made permanent: what it carries now differs from what it
// was minted with, and the view must show the former as its reference.
const REVISED = {
  collection: 4,
  item: 1,
  name: 'revised-track',
  origin: ref('2e', 305),
  current: ref('3d', 377),
  commit: { kind: 'SHA-1', id: 'b2'.repeat(20) },
  revisable: false,
};
const BEFORE = [FRESH, REVISED];
// The host's answer AFTER "Make permanent": the first asset is permanent, and
// one that was minted meanwhile has arrived. An optimistic view cannot know it.
const ARRIVED = {
  collection: 4,
  item: 2,
  name: 'arrived-meanwhile',
  origin: ref('4c', 99),
  current: ref('4c', 99),
  commit: { kind: 'SHA-1', id: 'c3'.repeat(20) },
  revisable: true,
};
const AFTER = [{ ...FRESH, revisable: false }, REVISED, ARRIVED];
// After a trade of REVISED and ARRIVED, the host answers with what is left. A
// view that removed the cards itself would show the same thing, which is why
// the check also counts the calls and reads the arguments.
const TRADED = [{ ...FRESH, revisable: false }];
const RECIPIENT = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
const VOCABULARY = [
  {
    id: 'gaming',
    name: 'Gaming',
    note: null,
    fields: [
      { id: 'kind', label: 'What it is', options: ['Game', 'Tool'] },
      { id: 'players', label: 'Players', options: ['One', 'Online together'] },
    ],
  },
  {
    id: 'physical',
    name: 'Physical (offline)',
    note: 'The chain moves the record, not the object.',
    fields: [{ id: 'arrives', label: 'What actually arrives', options: [] }],
  },
];
const PARTNER = {
  address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
  label: null,
  last_traded: 1_758_600_000,
  trades: 3,
};
const MESSAGE = 'for the album';

const HISTORY_REFUSAL =
  'Transaction history is not available yet. A Substrate node serves no history RPC; it comes from an indexer over the chain\'s events (ADR-028), which is not built.';

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// --- serve the build -------------------------------------------------------

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(dist, path === '/' ? 'index.html' : path.replace(/^\/+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const appUrl = `http://127.0.0.1:${server.address().port}/`;

// --- drive a real rendering engine ----------------------------------------

const profile = await mkdtemp(join(tmpdir(), 'qor-inventory-'));
const port = 9800 + Math.floor(Math.random() * 400);
const browser = spawn(
  BROWSER,
  [
    '--headless=new',
    // CI's container cannot give Chromium a sandbox (.woodpecker/launcher.yaml).
    ...(process.env.QOR_CHECK_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const finish = async () => {
  try { browser.kill(); } catch {}
  try { server.close(); } catch {}
  await rm(profile, { recursive: true, force: true }).catch(() => {});
};

try {
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
    } catch {
      await sleep(100);
    }
  }
  if (!target) throw new Error('The browser did not expose a page to inspect');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  let nextId = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (message) => {
    const msg = JSON.parse(message.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method) {
      events.push(msg);
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok) => {
      const id = ++nextId;
      pending.set(id, ok);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) {
      throw new Error(`${expression}\n${JSON.stringify(r.result.exceptionDetails)}`);
    }
    return r.result.result.value;
  };

  // A stand-in host: the fixture for drc369_*, history refused as the real host
  // refuses it, and enough of the bootstrap for the shell to render its rail.
  const ACCOUNTS = [{ address: ADDRESS, account_id: '0x' + '00'.repeat(32), path: '', index: 0, label: 'Fixture' }];
  const SESSION = {
    qor_id: 'fixture-qor-id', username: 'fixture', discriminator: 1,
    role: 'user', address: ADDRESS, avatar_url: null,
  };
  const STATE = {
    version: '0.0.0-fixture',
    vault: { state: 'unlocked', accounts: ACCOUNTS, locks_in: 900 },
    session: SESSION,
    chain_endpoint: 'ws://127.0.0.1:0',
    auth_endpoint: 'http://127.0.0.1:0',
    token: { symbol: 'CGT', name: 'Creator God Token', decimals: 18, sub_unit: 'Spark' },
  };
  const HOST_STUB = `
    window.__BEFORE__ = ${JSON.stringify(BEFORE)};
    window.__AFTER__ = ${JSON.stringify(AFTER)};
    window.__TRADED__ = ${JSON.stringify(TRADED)};
    window.__TRADE_CALLS__ = [];
    window.__LISTING_SAVES__ = [];
    window.__VOCABULARY__ = ${JSON.stringify(VOCABULARY)};
    window.__MODE__ = 'before';
    window.__ASSET_CALLS__ = [];
    window.__PERMANENT_CALLS__ = [];
    window.__LAUNCHER_STATE__ = ${JSON.stringify(STATE)};
    window.__ACCOUNTS__ = ${JSON.stringify(ACCOUNTS)};
    window.__SESSION__ = ${JSON.stringify(SESSION)};
    window.__TAURI_INTERNALS__ = {
      invoke: (cmd, args) => {
        if (cmd === 'drc369_assets') {
          window.__ASSET_CALLS__.push(args);
          if (window.__MODE__ === 'fail')
            return Promise.reject({ kind: 'rpc', message: 'the node did not answer: fixture outage' });
          if (window.__MODE__ === 'empty') return Promise.resolve([]);
          if (window.__MODE__ === 'traded') return Promise.resolve(window.__TRADED__);
          return Promise.resolve(window.__MODE__ === 'after' ? window.__AFTER__ : window.__BEFORE__);
        }
        if (cmd === 'drc369_make_permanent') {
          window.__PERMANENT_CALLS__.push(args);
          window.__MODE__ = 'after';
          return Promise.resolve({ collection: args.collection, item: args.item, tx_hash: '0x01', block_hash: '0x02' });
        }
        if (cmd === 'listing_vocabulary') return Promise.resolve(window.__VOCABULARY__);
        if (cmd === 'listing_drafts') return Promise.resolve([]);
        if (cmd === 'listing_save') {
          window.__LISTING_SAVES__.push(args.draft);
          return Promise.resolve({
            ...args.draft,
            price_sparks: '1',
            created: 1,
            updated: 2,
          });
        }
        if (cmd === 'trade_partners') return Promise.resolve([${JSON.stringify(PARTNER)}]);
        if (cmd === 'drc369_trade') {
          window.__TRADE_CALLS__.push(args);
          window.__MODE__ = 'traded';
          return Promise.resolve({
            moved: args.items,
            to: args.to,
            tx_hash: '0x03',
            block_hash: '0x04',
          });
        }
        if (cmd === 'cgt_history')
          return Promise.reject({ kind: 'rpc', message: ${JSON.stringify(HISTORY_REFUSAL)} });
        if (cmd === 'launcher_state') return Promise.resolve(window.__LAUNCHER_STATE__);
        if (cmd === 'vault_status')
          return Promise.resolve({ state: 'unlocked', accounts: window.__ACCOUNTS__, locks_in: 900 });
        if (cmd === 'qor_restore') return Promise.resolve(window.__SESSION__);
        if (cmd === 'touch_vault' || cmd === 'vault_lock') return Promise.resolve(null);
        return Promise.reject({ kind: 'internal', message: 'no host in this check' });
      },
      transformCallback: () => 0,
      unregisterCallback: () => {},
      convertFileSrc: (s) => s,
      metadata: { currentWindow: { label: 'main' }, currentWebview: { windowLabel: 'main', label: 'main' } },
      plugins: {},
    };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
  `;

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: HOST_STUB });
  await send('Page.navigate', { url: appUrl });
  for (let i = 0; i < 100 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(800);

  // Open the Inventory the way a person does: the rail button with that label.
  const opened = await evaluate(`(() => {
    const b = [...document.querySelectorAll('nav[aria-label="Primary"] button')]
      .find((n) => n.textContent.trim() === 'Inventory');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check('the rail has an Inventory button and it opens the surface', opened === true);
  await sleep(600);

  const heading = await evaluate(`document.querySelector('main h1')?.textContent.trim() ?? ''`);
  check('the surface is Inventory', heading === 'Inventory', heading);

  // Everything drawn for one asset, by its collection/item.
  const drawn = () => evaluate(`[...document.querySelectorAll('main [data-asset]')].map((row) => ({
    id: row.getAttribute('data-asset'),
    text: row.textContent,
    name: row.querySelector('[data-asset-name]')?.textContent.trim() ?? '',
    status: row.querySelector('[data-asset-status]')?.textContent.trim() ?? '',
    root: row.querySelector('[data-asset-root]')?.textContent.trim() ?? '',
    commit: row.querySelector('[data-asset-commit]')?.textContent.trim() ?? '',
    permanentButtons: [...row.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Make permanent').length,
  }))`);

  const calls = await evaluate(`window.__ASSET_CALLS__`);
  check(
    'the host was asked for the active account\'s assets',
    Array.isArray(calls) && calls.length >= 1 && calls.every((c) => c.address === ADDRESS),
    JSON.stringify(calls),
  );

  const assertMatches = (rows, fixture, when) => {
    check(
      `${when}: one row per asset the host returned`,
      rows.length === fixture.length,
      `${rows.length} drawn, ${fixture.length} returned`,
    );
    for (const asset of fixture) {
      const id = `${asset.collection}/${asset.item}`;
      const row = rows.find((r) => r.id === id);
      check(`${when}: asset ${id} is drawn`, Boolean(row));
      if (!row) continue;
      check(`${when}: ${id} shows its project name`, row.name === asset.name, row.name);
      check(
        `${when}: ${id} shows the reference it carries NOW`,
        row.root === `${asset.current.algo} ${asset.current.root}`,
        row.root,
      );

      check(
        `${when}: ${id} shows the commit it pins, by hash`,
        row.commit.includes(asset.commit.id) && row.commit.includes(asset.commit.kind),
        row.commit,
      );
      check(
        `${when}: ${id} reads ${asset.revisable ? 'Revisable' : 'Permanent'}`,
        row.status === (asset.revisable ? 'Revisable' : 'Permanent'),
        row.status,
      );
      check(
        `${when}: ${id} offers "Make permanent" only if it is revisable`,
        row.permanentButtons === (asset.revisable ? 1 : 0),
        `${row.permanentButtons}`,
      );
    }
  };

  // The card face carries identity; the close-up carries the rest. Opened by the
  // card's own title button, as a person opens it, and closed with Escape.
  const closeUp = async (fixture, when) => {
    for (const asset of fixture) {
      const id = `${asset.collection}/${asset.item}`;
      const opened = await evaluate(`(() => {
        const card = document.querySelector('main [data-asset="${id}"]');
        const open = card && card.querySelector('[data-asset-name]');
        if (!open) return false;
        open.click();
        return true;
      })()`);
      await sleep(250);
      const shown = await evaluate(`(() => {
        const panel = document.querySelector('[data-asset-closeup]');
        return panel ? panel.textContent : null;
      })()`);
      check(`${when}: ${id} opens at size`, opened === true && typeof shown === 'string');
      if (typeof shown === 'string') {
        check(
          `${when}: ${id}'s close-up shows its manifest size`,
          shown.includes(`${asset.current.size} bytes`),
        );
        check(
          `${when}: ${id}'s close-up shows the reference it carries now`,
          shown.includes(asset.current.root),
        );
        const revised = asset.origin.root !== asset.current.root;
        check(
          `${when}: ${id}'s close-up ${revised ? 'shows' : 'does not show'} what it was minted as`,
          revised ? shown.includes('Minted as') && shown.includes(asset.origin.root) : !shown.includes('Minted as'),
        );
      }
      await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
      await sleep(200);
      check(
        `${when}: ${id} closes again`,
        (await evaluate(`Boolean(document.querySelector('[data-asset-closeup]'))`)) === false,
      );
    }
  };

  assertMatches(await drawn(), BEFORE, 'before');
  await closeUp(BEFORE, 'before');

  const history = await evaluate(`document.querySelector('main')?.textContent.includes('ADR-028') ?? false`);
  check('history says why it is absent, in the host\'s words', history === true);

  // Every class the surface uses must exist in the stylesheet (see the same
  // check in check-projects-view.mjs for why).
  const undefinedClasses = await evaluate(`(() => {
    const selectors = [];
    const walk = (list) => {
      for (const rule of list) {
        if (rule.selectorText) selectors.push(rule.selectorText);
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules); } catch {}
    }
    const all = selectors.join(' ');
    const used = new Set();
    for (const el of document.querySelectorAll('main [class]')) for (const c of el.classList) used.add(c);
    return [...used]
      .filter((c) => !c.startsWith('lucide'))
      .filter((c) => !all.includes('.' + CSS.escape(c)))
      .sort();
  })()`);
  check(
    'every class the surface uses is defined by the stylesheet',
    undefinedClasses.length === 0,
    undefinedClasses.join(' '),
  );

  // Make the revisable one permanent.
  const before = (await evaluate(`window.__ASSET_CALLS__.length`)) ?? 0;
  const clicked = await evaluate(`(() => {
    const row = document.querySelector('main [data-asset="${FRESH.collection}/${FRESH.item}"]');
    const b = row && [...row.querySelectorAll('button')].find((n) => n.textContent.trim() === 'Make permanent');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check('"Make permanent" can be pressed on the revisable asset', clicked === true);
  await sleep(700);

  const permanentCalls = await evaluate(`window.__PERMANENT_CALLS__`);
  check(
    'the host was asked to make it permanent exactly once',
    Array.isArray(permanentCalls) && permanentCalls.length === 1,
    `${permanentCalls?.length}`,
  );
  check(
    'for the active account and exactly that asset',
    permanentCalls?.[0]?.from === ADDRESS &&
      permanentCalls?.[0]?.collection === FRESH.collection &&
      permanentCalls?.[0]?.item === FRESH.item,
    JSON.stringify(permanentCalls?.[0]),
  );

  // THE ONE THAT MATTERS: afterwards the view asked the chain again and drew
  // that answer, including an asset it could not have known about.
  const after = (await evaluate(`window.__ASSET_CALLS__.length`)) ?? 0;
  check('afterwards the view asked the host again', after > before, `${before} -> ${after}`);
  assertMatches(await drawn(), AFTER, 'after');
  await closeUp(AFTER, 'after');


  // --- an asset's own menu, and a trade (L4.4, L4.5) ------------------------
  //
  // The menu must be reachable without a mouse, so it is opened here the way a
  // keyboard opens it: focus the card's button, then activate it. The pointer's
  // secondary button is checked too, because that is what the owner asked for.
  const menuId = `${REVISED.collection}/${REVISED.item}`;
  const addId = `${ARRIVED.collection}/${ARRIVED.item}`;

  const focused = await evaluate(`(() => {
    const button = document.querySelector('main [data-asset="${menuId}"] [data-asset-more]');
    if (!button) return 'no button';
    button.focus();
    return document.activeElement === button ? 'focused' : 'not focusable';
  })()`);
  check('an asset carries a menu button the keyboard can reach', focused === 'focused', String(focused));

  await evaluate(`document.activeElement.click()`);
  await sleep(200);
  const menu = await evaluate(`(() => {
    const menu = document.querySelector('[data-asset-menu]');
    if (!menu) return null;
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    return {
      role: menu.getAttribute('role'),
      focusedIsItem: items.includes(document.activeElement),
      sellDisabled: menu.querySelector('[data-asset-sell]')?.disabled === true,
      names: items.map((n) => n.textContent.trim()),
      text: menu.textContent,
    };
  })()`);
  check('the keyboard opens the menu', menu !== null);
  check('it is a menu, and it takes focus', menu?.role === 'menu' && menu?.focusedIsItem === true);
  check('Sell is offered, and the menu says a draft publishes nowhere',
    menu?.sellDisabled === false && /publishes nowhere/i.test(menu?.text ?? ''));
  // The owner looked for "Trade" and found "Send…", because the label used to
  // depend on how many assets the account held. A feature does not hide its own
  // name: these are the three things an asset offers, named.
  check('the menu names Trade first, then Sell, then Copy reference',
    JSON.stringify(menu?.names) === JSON.stringify(['Trade…', 'Sell', 'Copy reference']),
    JSON.stringify(menu?.names));

  // Escape closes it, and the secondary pointer button opens it again.
  await evaluate(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(150);
  check('Escape closes the menu', (await evaluate(`Boolean(document.querySelector('[data-asset-menu]'))`)) === false);

  const rightClicked = await evaluate(`(() => {
    const card = document.querySelector('main [data-asset="${menuId}"]');
    if (!card) return false;
    card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 }));
    return true;
  })()`);
  await sleep(200);
  check('the secondary pointer button opens it too', rightClicked === true &&
    (await evaluate(`Boolean(document.querySelector('[data-asset-menu]'))`)) === true);

  // Trade opens the dialog, with the asset the menu was raised from in it.
  await evaluate(`document.querySelector('[data-asset-menu] [role="menuitem"]').click()`);
  await sleep(250);
  const composing = await evaluate(`(() => {
    const dialog = document.querySelector('[data-trade-dialog]');
    if (!dialog) return null;
    const panel = dialog.querySelector('[role="dialog"]');
    return {
      step: panel?.getAttribute('data-trade-step'),
      chosen: [...dialog.querySelectorAll('[data-trade-picked] [data-trade-pick]')].map((n) => n.getAttribute('data-trade-pick')),
      offered: [...dialog.querySelectorAll('[data-trade-others] [data-trade-pick]')].map((n) => n.getAttribute('data-trade-pick')),
      reviewDisabled: dialog.querySelector('[data-trade-review]')?.disabled === true,
    };
  })()`);
  check('Trade opens the dialog at its first step', composing?.step === 'compose');

  const sides = await evaluate(`(() => {
    const dialog = document.querySelector('[data-trade-dialog]');
    if (!dialog) return null;
    const partner = dialog.querySelector('[data-trade-partners] [data-trade-partner]');
    return {
      leaving: Boolean(dialog.querySelector('[data-trade-from]')),
      going: Boolean(dialog.querySelector('[data-trade-to-side]')),
      lane: Boolean(dialog.querySelector('[data-trade-lane]')),
      laneHidden: dialog.querySelector('[data-trade-lane]')?.getAttribute('aria-hidden') === 'true',
      partner: partner ? partner.getAttribute('data-trade-partner') : null,
    };
  })()`);
  check('the trade has two sides and a lane between them',
    sides?.leaving === true && sides?.going === true && sides?.lane === true);
  check('the lane is decoration, and says so to assistive technology', sides?.laneHidden === true);
  check('someone traded with before is offered', sides?.partner === PARTNER.address,
    String(sides?.partner));

  // Choosing one fills the destination, so a second trade is two clicks.
  await evaluate(`document.querySelector('[data-trade-partners] [data-trade-partner]').click()`);
  await sleep(200);
  check('choosing them fills the destination',
    (await evaluate(`document.querySelector('[data-trade-to]')?.value`)) === PARTNER.address);
  check('the asset the menu was raised from is in the trade', JSON.stringify(composing?.chosen) === JSON.stringify([menuId]));
  check('the account\'s other assets are offered', (composing?.offered ?? []).includes(addId));
  check('with no destination it cannot be reviewed', composing?.reviewDisabled === true);

  // React owns these inputs, so type the way a person does: through the
  // native setter, then the event React listens for.
  const type = (selector, text) => evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(input, ${JSON.stringify(text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  check('the destination can be typed', (await type('[data-trade-to]', RECIPIENT)) === true);
  check('a message can be typed', (await type('[data-trade-message]', MESSAGE)) === true);
  await evaluate(`document.querySelector('[data-trade-others] [data-trade-pick="${addId}"]').click()`);
  await sleep(200);
  const chosen = await evaluate(`[...document.querySelectorAll('[data-trade-picked] [data-trade-pick]')].map((n) => n.getAttribute('data-trade-pick'))`);
  check('another asset can be added to the trade', chosen?.length === 2 && chosen.includes(addId), JSON.stringify(chosen));

  // Nothing has been sent, and nothing may be sent before the warning.
  check('nothing has been sent yet', (await evaluate(`window.__TRADE_CALLS__.length`)) === 0);
  // Tag Review's element before it is pressed. If React reuses it as Send, Send
  // cross-fades out of the primary button's colours for 200ms, and the
  // readability check measured it mid-fade (2026-09-26).
  await evaluate(`document.querySelector('[data-trade-review]').dataset.wasReview = 'yes'`);
  await evaluate(`document.querySelector('[data-trade-review]').click()`);
  await sleep(250);
  check('Send is a new button, not Review turned into it',
    (await evaluate(`document.querySelector('[data-trade-send]')?.dataset.wasReview ?? 'fresh'`)) === 'fresh');
  const warning = await evaluate(`(() => {
    const panel = document.querySelector('[data-trade-dialog] [role="dialog"]');
    const shown = document.querySelector('[data-trade-warning]');
    return panel && shown ? { step: panel.getAttribute('data-trade-step'), text: shown.textContent } : null;
  })()`);
  check('reviewing sends nothing', (await evaluate(`window.__TRADE_CALLS__.length`)) === 0);
  check('the second step is the warning', warning?.step === 'confirm');
  check('it names the destination', (warning?.text ?? '').includes(RECIPIENT));
  check('it names every asset in the trade',
    (warning?.text ?? '').includes(REVISED.name) && (warning?.text ?? '').includes(ARRIVED.name));
  check('it says ownership transfers and cannot be undone',
    /cannot be undone/i.test(warning?.text ?? '') && /ownership transfers/i.test(warning?.text ?? ''));
  check('it repeats that the message is public and permanent',
    /read, for ever|anyone can read/i.test(warning?.text ?? '') && (warning?.text ?? '').includes(MESSAGE));

  // Sending asks the host once, with exactly what was chosen.
  const asksBefore = (await evaluate(`window.__ASSET_CALLS__.length`)) ?? 0;
  await evaluate(`document.querySelector('[data-trade-send]').click()`);
  await sleep(800);
  const sent = await evaluate(`window.__TRADE_CALLS__`);
  check('sending asks the host exactly once', Array.isArray(sent) && sent.length === 1, JSON.stringify(sent));
  const call = sent?.[0] ?? {};
  check('it sends the address that was typed', call.to === RECIPIENT, String(call.to));
  check('it sends both assets and nothing else',
    JSON.stringify((call.items ?? []).map((i) => `${i.collection}/${i.item}`).sort()) ===
      JSON.stringify([menuId, addId].sort()), JSON.stringify(call.items));
  check('it sends the message that was typed', call.message === MESSAGE, String(call.message));

  // And afterwards the view draws what the chain says, not what it hoped.
  check('afterwards it asks the host what is held',
    ((await evaluate(`window.__ASSET_CALLS__.length`)) ?? 0) > asksBefore);
  check('the dialog closes', (await evaluate(`Boolean(document.querySelector('[data-trade-dialog]'))`)) === false);
  assertMatches(await drawn(), TRADED, 'after the trade');


  // --- Sell: a draft listing, and nothing published (L4.6) -----------------
  // The asset the trade raised its menu from has just left this account, so the
  // listing is drafted for the one still held. No `?.` on these clicks: a card
  // that is not there must throw here, not pass by doing nothing.
  const sellId = `${FRESH.collection}/${FRESH.item}`;
  await evaluate(`document.querySelector('main [data-asset="${sellId}"] [data-asset-more]').click()`);
  await sleep(250);
  await evaluate(`document.querySelectorAll('[data-asset-menu] [role="menuitem"]')[1].click()`);
  await sleep(300);

  const sell = await evaluate(`(() => {
    const dialog = document.querySelector('[data-sell-dialog]');
    if (!dialog) return null;
    return {
      unpublished: dialog.querySelector('[data-sell-unpublished]')?.textContent ?? '',
      asset: Boolean(dialog.querySelector('[data-sell-asset]')),
      categories: [...dialog.querySelectorAll('[data-sell-category]')].map((n) => n.getAttribute('data-sell-category')),
      fields: [...dialog.querySelectorAll('[data-sell-field]')].length,
      title: dialog.querySelector('[data-sell-title]')?.value ?? null,
      saveDisabled: dialog.querySelector('[data-sell-save]')?.disabled === true,
    };
  })()`);
  check('Sell opens a listing form beside the asset', sell !== null && sell.asset === true);
  check('it says, in the product, that nothing is published',
    /nothing here is published/i.test(sell?.unpublished ?? '') && /marketplace/i.test(sell?.unpublished ?? ''));
  check('the categories come from the host, not from this view',
    JSON.stringify(sell?.categories) === JSON.stringify(VOCABULARY.map((c) => c.id)),
    JSON.stringify(sell?.categories));
  check('no category is chosen, so nothing is asked yet', sell?.fields === 0, String(sell?.fields));
  check('the title starts as the name the chain holds', sell?.title === FRESH.name, String(sell?.title));
  check('it cannot be saved before a kind and a price', sell?.saveDisabled === true);

  // Choosing a kind asks that kind's questions, and only those.
  await evaluate(`document.querySelector('[data-sell-category="gaming"]').click()`);
  await sleep(200);
  const gaming = await evaluate(`[...document.querySelectorAll('[data-sell-field]')].map((n) => n.getAttribute('data-sell-field'))`);
  check('choosing Gaming asks the gaming questions',
    JSON.stringify(gaming) === JSON.stringify(['kind', 'players']), JSON.stringify(gaming));

  await evaluate(`document.querySelector('[data-sell-category="physical"]').click()`);
  await sleep(200);
  const physical = await evaluate(`(() => ({
    fields: [...document.querySelectorAll('[data-sell-field]')].map((n) => n.getAttribute('data-sell-field')),
    note: document.querySelector('[data-sell-note]')?.textContent ?? null,
  }))()`);
  check('choosing another kind asks different questions',
    JSON.stringify(physical?.fields) === JSON.stringify(['arrives']), JSON.stringify(physical?.fields));
  check('a kind that needs a warning shows it before anything is typed',
    /not the object/i.test(physical?.note ?? ''), String(physical?.note));

  // What is typed is what the host is sent: no more, no less.
  await evaluate(`document.querySelector('[data-sell-category="gaming"]').click()`);
  await sleep(200);
  await type('[data-sell-title]', 'A tower defence');
  await type('[data-sell-price]', '1200.5');
  await evaluate(`document.querySelector('[data-sell-option="kind:Tool"]').click()`);
  await sleep(200);
  check('nothing has been saved yet', (await evaluate(`window.__LISTING_SAVES__.length`)) === 0);
  await evaluate(`document.querySelector('[data-sell-save]').click()`);
  await sleep(400);
  const saves = await evaluate(`window.__LISTING_SAVES__`);
  check('saving sends the host one draft', Array.isArray(saves) && saves.length === 1, JSON.stringify(saves));
  const draft = saves?.[0] ?? {};
  check('it sends the title, the kind and the price that were typed',
    draft.title === 'A tower defence' && draft.category === 'gaming' && draft.price_cgt === '1200.5',
    JSON.stringify(draft));
  check('it sends the answer that was chosen, and no answer that was not',
    JSON.stringify(draft.details) === JSON.stringify([{ field: 'kind', value: 'Tool' }]),
    JSON.stringify(draft.details));
  check('it is for the asset whose menu was used',
    `${draft.collection}/${draft.item}` === sellId, `${draft.collection}/${draft.item}`);
  check('and the person is told it went no further',
    /not published anywhere/i.test(await evaluate(`document.querySelector('[data-sell-saved]')?.textContent ?? ''`)));

  await evaluate(`document.querySelector('[data-sell-dialog] [aria-label="Close"]').click()`);
  await sleep(250);
  check('the listing form closes', (await evaluate(`Boolean(document.querySelector('[data-sell-dialog]'))`)) === false);

  // Nothing held: it says so.
  await evaluate(`window.__MODE__ = 'empty'`);
  const refresh = `(() => {
    const b = [...document.querySelectorAll('main button')].find((n) => n.textContent.trim() === 'Refresh');
    if (!b) return false;
    b.click();
    return true;
  })()`;
  check('there is a Refresh', (await evaluate(refresh)) === true);
  await sleep(600);
  let rows = await drawn();
  let body = await evaluate(`document.querySelector('main')?.textContent ?? ''`);
  check('with nothing held there are no rows', rows.length === 0, `${rows.length}`);
  check('with nothing held it says so', body.includes('No assets yet'));

  // The chain cannot be read: it says that, not "nothing held".
  await evaluate(`window.__MODE__ = 'fail'`);
  await evaluate(refresh);
  await sleep(600);
  rows = await drawn();
  body = await evaluate(`document.querySelector('main')?.textContent ?? ''`);
  check('when the chain cannot be read there are no rows', rows.length === 0, `${rows.length}`);
  check(
    'when the chain cannot be read it says so, with the host\'s reason',
    body.includes('Could not read') && body.includes('fixture outage'),
  );
  check(
    'and it does not claim that nothing is held',
    !body.includes('No assets yet'),
  );
} finally {
  await finish();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\nRESULT: ${results.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
