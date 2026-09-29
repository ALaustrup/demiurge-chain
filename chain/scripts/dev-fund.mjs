// DEVELOPMENT CHAIN ONLY. Sends CGT from Alice's development account to an
// address, so a fresh account on a `--dev` node can pay the deposits a mint
// holds (M4.1).
//
// It CREATES NOTHING. It is one ordinary `transfer_keep_alive` out of the
// endowment the development chain specification gives Alice, a well-known key
// whose seed is public. No CGT comes into existence: total issuance is the same
// before and after, and the script checks that it is. AGENTS.md §5 forbids any
// path that creates CGT outside `--dev`; this one does not create any inside it
// either.
//
// It REFUSES any node that does not report a development chain
// (`system_chainType` must be "Development", which only `--dev` gives). A local
// two-validator chain reports "Local" and is refused; so is anything else.
//
//   cd chain/scripts && npm install
//   node dev-fund.mjs <address> [amount in CGT, default 10000] [--endpoint ws://127.0.0.1:9944]
//
// The amount is decimal CGT, at most eighteen places. More precision than that
// is refused rather than rounded, and no floating point touches it (AGENTS.md §5).

import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

const DECIMALS = 18n;
const DEFAULT_AMOUNT = '10000';
const DEFAULT_ENDPOINT = 'ws://127.0.0.1:9944';

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node dev-fund.mjs <address> [amount in CGT] [--endpoint ws://127.0.0.1:9944]');
  process.exit(2);
}

/** Decimal CGT to Sparks, exactly, or a refusal. */
function toSparks(text) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) usage(`"${text}" is not an amount of CGT.`);
  const [, whole, fraction = ''] = match;
  if (BigInt(fraction.length) > DECIMALS) {
    usage(`"${text}" has more than ${DECIMALS} decimal places. Refused rather than rounded.`);
  }
  const sparks = BigInt(whole) * 10n ** DECIMALS + BigInt(fraction.padEnd(Number(DECIMALS), '0') || '0');
  if (sparks === 0n) usage('The amount must be more than zero.');
  return sparks;
}

function cgt(sparks) {
  const whole = sparks / 10n ** DECIMALS;
  const fraction = (sparks % 10n ** DECIMALS).toString().padStart(Number(DECIMALS), '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

const args = process.argv.slice(2);
let endpoint = DEFAULT_ENDPOINT;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--endpoint') endpoint = args[++i] ?? usage('--endpoint needs a value.');
  else positional.push(args[i]);
}
const [target, amountText = DEFAULT_AMOUNT] = positional;
if (!target || positional.length > 2) usage();

let targetId;
try {
  targetId = decodeAddress(target);
} catch {
  usage(`"${target}" is not an SS58 address.`);
}
const amount = toSparks(amountText);

await cryptoWaitReady();
const api = await ApiPromise.create({ provider: new WsProvider(endpoint), noInitWarn: true, throwOnConnect: true });

try {
  const [chainType, chainName] = await Promise.all([api.rpc.system.chainType(), api.rpc.system.chain()]);
  if (!chainType.isDevelopment) {
    console.error(
      `Refused: ${endpoint} is "${chainName}", which reports chain type "${chainType}". ` +
        'This script runs against a development chain (--dev) only.',
    );
    process.exitCode = 3;
  } else {
    const alice = new Keyring({ type: 'sr25519', ss58Format: api.registry.chainSS58 }).addFromUri('//Alice');
    const to = encodeAddress(targetId, api.registry.chainSS58);
    if (to === alice.address) usage('That is Alice. Nothing to send.');

    const issuanceBefore = (await api.query.balances.totalIssuance()).toBigInt();

    const blockHash = await new Promise((resolve, reject) => {
      api.tx.balances
        .transferKeepAlive(to, amount)
        .signAndSend(alice, ({ status, dispatchError }) => {
          if (dispatchError) {
            const detail = dispatchError.isModule
              ? (({ section, name }) => `${section}.${name}`)(api.registry.findMetaError(dispatchError.asModule))
              : dispatchError.toString();
            reject(new Error(`the transfer failed: ${detail}`));
          } else if (status.isFinalized) {
            resolve(status.asFinalized.toHex());
          }
        })
        .catch(reject);
    });

    const issuanceAfter = (await api.query.balances.totalIssuance()).toBigInt();
    if (issuanceAfter !== issuanceBefore) {
      throw new Error(`total issuance moved from ${issuanceBefore} to ${issuanceAfter}; a transfer must not`);
    }
    const account = await api.query.system.account(to);

    console.log(`Sent ${cgt(amount)} CGT from Alice to ${to} on "${chainName}" (${chainType}).`);
    console.log(`Finalised in ${blockHash}.`);
    console.log(`${to} now holds ${cgt(account.data.free.toBigInt())} CGT free.`);
    console.log('Total issuance is unchanged: nothing was created.');
  }
} catch (error) {
  console.error(`dev-fund: ${error.message}`);
  process.exitCode = 1;
} finally {
  await api.disconnect();
}
