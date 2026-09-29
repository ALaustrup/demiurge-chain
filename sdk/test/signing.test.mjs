/**
 * Cross-language signing vectors.
 *
 * The constants below are asserted identically in
 * `framework/rpc/tests/auth_integration_test.rs::signing_payload_test_vectors`.
 * If the two encoders drift, the node will reject every signature this SDK
 * produces - so both sides pin the same bytes.
 *
 * Run with:  node --test sdk/test/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SigningPayload, payloads, accountBytes, CHAIN_DOMAIN } from '../src/signing.ts';

const hex = (bytes) => Buffer.from(bytes).toString('hex');

const FROM = '11'.repeat(32);
const TO = '22'.repeat(32);

const TRANSFER_VECTOR =
  '130000000000000064656d69757267653a6d61696e6e65743a7631110000000000000062616c616e6365735f7472616e7366657220000000000000001111111111111111111111111111111111111111111111111111111111111111200000000000000022222222222222222222222222222222222222222222222222222222222222221000000000000000d202964900000000000000000000000008000000000000000700000000000000';

const ROYALTY_VECTOR =
  '130000000000000064656d69757267653a6d61696e6e65743a763111000000000000006472633336395f736574526f79616c74790800000000000000746f6b656e2d3432200000000000000022222222222222222222222222222222222222222222222222222222222222220200000000000000fa0008000000000000000300000000000000';

const CLAIM_NONE_VECTOR =
  '130000000000000064656d69757267653a6d61696e6e65743a76311600000000000000636f6e73656e7375735f636c61696d526577617264732000000000000000111111111111111111111111111111111111111111111111111111111111111101000000000000000008000000000000000000000000000000';

test('transfer payload matches the Rust vector', () => {
  assert.equal(hex(payloads.transfer(FROM, TO, '1234567890', 7)), TRANSFER_VECTOR);
});

test('setRoyalty payload matches the Rust vector', () => {
  assert.equal(hex(payloads.drc369SetRoyalty('token-42', TO, 250, 3)), ROYALTY_VECTOR);
});

test('claimRewards with no validator matches the Rust vector', () => {
  assert.equal(hex(payloads.claimRewards(FROM, null, 0)), CLAIM_NONE_VECTOR);
});

test('the payload opens with the chain domain', () => {
  const bytes = payloads.transfer(FROM, TO, '1', 0);
  const domain = Buffer.from(CHAIN_DOMAIN);
  assert.deepEqual(Buffer.from(bytes.slice(8, 8 + domain.length)), domain);
});

test('field encoding is injective', () => {
  const a = new SigningPayload('m').text('ab').text('c').finish(0);
  const b = new SigningPayload('m').text('a').text('bc').finish(0);
  assert.notEqual(hex(a), hex(b));
});

test('null and empty string encode differently', () => {
  const none = new SigningPayload('m').optText(null).finish(0);
  const empty = new SigningPayload('m').optText('').finish(0);
  assert.notEqual(hex(none), hex(empty));
});

test('the nonce changes the payload', () => {
  assert.notEqual(
    hex(payloads.transfer(FROM, TO, '100', 0)),
    hex(payloads.transfer(FROM, TO, '100', 1)),
  );
});

test('the method name changes the payload', () => {
  assert.notEqual(
    hex(payloads.stake(FROM, TO, '100', 0)),
    hex(payloads.unstake(FROM, TO, '100', 0)),
  );
});

test('large amounts survive without precision loss', () => {
  // Beyond Number.MAX_SAFE_INTEGER: must be handled as BigInt, not float.
  const big = '340282366920938463463374607431768211455'; // u128::MAX
  const bytes = payloads.transfer(FROM, TO, big, 0);
  assert.ok(hex(bytes).includes('ff'.repeat(16)));
});

test('amounts exceeding u128 are rejected', () => {
  assert.throws(() => payloads.transfer(FROM, TO, '340282366920938463463374607431768211456', 0));
});

test('accountBytes tolerates a 0x prefix', () => {
  assert.deepEqual(accountBytes('0x' + FROM), accountBytes(FROM));
});

test('a short account is rejected', () => {
  assert.throws(() => new SigningPayload('m').account('1122'));
});

test('invalid hex is rejected', () => {
  assert.throws(() => accountBytes('zz'));
});
