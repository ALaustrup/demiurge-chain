/**
 * Canonical request signing for state-changing RPC calls.
 *
 * This is the TypeScript counterpart of `framework/rpc/src/auth.rs`. The two
 * MUST produce byte-identical payloads: the node verifies the signature over
 * the bytes it rebuilds itself, so any divergence shows up as a rejected
 * request rather than a silent security hole.
 *
 * Encoding rules (mirrored from auth.rs):
 *  - Every field is prefixed with its length as a u64 little-endian.
 *  - The payload opens with the chain domain, then the method name.
 *  - The payload closes with the request nonce.
 *
 * Length-prefixing makes the encoding injective, so ("ab","c") can never
 * collide with ("a","bc").
 */

/** Chain domain separator. Must match `CHAIN_DOMAIN` in auth.rs. */
export const CHAIN_DOMAIN = 'demiurge:mainnet:v1';

const textEncoder = new TextEncoder();

function u64le(value: number | bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, BigInt(value), true);
  return buf;
}

function u128le(value: string | number | bigint): Uint8Array {
  let v = BigInt(value);
  if (v < 0n) throw new Error('u128 field cannot be negative');
  const buf = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  if (v !== 0n) throw new Error('value exceeds u128 range');
  return buf;
}

function u16le(value: number): Uint8Array {
  const buf = new Uint8Array(2);
  new DataView(buf.buffer).setUint16(0, value, true);
  return buf;
}

/** Decode a hex account/address to raw bytes, tolerating a `0x` prefix. */
export function accountBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string: ${hex}`);
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

/**
 * Builds the exact byte string the node will verify against.
 *
 * Append fields in the same order the corresponding Rust handler does, then
 * call `finish(nonce)`.
 */
export class SigningPayload {
  private parts: Uint8Array[] = [];

  constructor(method: string) {
    this.pushField(textEncoder.encode(CHAIN_DOMAIN));
    this.pushField(textEncoder.encode(method));
  }

  private pushField(value: Uint8Array): void {
    this.parts.push(u64le(value.length), value);
  }

  /** Append raw bytes. */
  bytes(value: Uint8Array): this {
    this.pushField(value);
    return this;
  }

  /** Append a UTF-8 string. */
  text(value: string): this {
    this.pushField(textEncoder.encode(value));
    return this;
  }

  /**
   * Append an optional string. `null`/`undefined` encodes distinctly from `''`,
   * matching `opt_text` in auth.rs.
   */
  optText(value: string | null | undefined): this {
    if (value === null || value === undefined) {
      this.pushField(new Uint8Array([0]));
    } else {
      this.pushField(new Uint8Array([1]));
      this.pushField(textEncoder.encode(value));
    }
    return this;
  }

  /** Append a 32-byte account ID, given as hex or raw bytes. */
  account(value: string | Uint8Array): this {
    const bytes = typeof value === 'string' ? accountBytes(value) : value;
    if (bytes.length !== 32) {
      throw new Error(`Account must be 32 bytes, got ${bytes.length}`);
    }
    this.pushField(bytes);
    return this;
  }

  /** Append a u128 amount. Accepts a decimal string to avoid precision loss. */
  amount(value: string | number | bigint): this {
    this.pushField(u128le(value));
    return this;
  }

  /** Append a u64 field. */
  num64(value: number | bigint): this {
    this.pushField(u64le(value));
    return this;
  }

  /** Append a u16 field (basis points). */
  num16(value: number): this {
    this.pushField(u16le(value));
    return this;
  }

  /** Append a u8 field (commission rate). */
  num8(value: number): this {
    this.pushField(new Uint8Array([value & 0xff]));
    return this;
  }

  /** Finalise by committing to the request nonce. */
  finish(nonce: number | bigint): Uint8Array {
    this.pushField(u64le(nonce));

    const total = this.parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of this.parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
}

/**
 * Payload builders for each signed RPC method.
 *
 * Keep these in lockstep with the `SigningPayload::new(...)` calls in
 * `framework/rpc/src/methods.rs`.
 */
export const payloads = {
  transfer(from: string, to: string, amount: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('balances_transfer')
      .account(from)
      .account(to)
      .amount(amount)
      .finish(nonce);
  },

  registerValidator(
    validator: string,
    stake: string,
    commission: number,
    nonce: number | bigint,
  ): Uint8Array {
    return new SigningPayload('consensus_registerValidator')
      .account(validator)
      .amount(stake)
      .num8(commission)
      .finish(nonce);
  },

  claimRewards(
    claimer: string,
    validator: string | null | undefined,
    nonce: number | bigint,
  ): Uint8Array {
    return new SigningPayload('consensus_claimRewards')
      .account(claimer)
      .optText(validator)
      .finish(nonce);
  },

  updateCommission(validator: string, commission: number, nonce: number | bigint): Uint8Array {
    return new SigningPayload('consensus_updateCommission')
      .account(validator)
      .num8(commission)
      .finish(nonce);
  },

  stake(nominator: string, validator: string, amount: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('consensus_stake')
      .account(nominator)
      .account(validator)
      .amount(amount)
      .finish(nonce);
  },

  unstake(nominator: string, validator: string, amount: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('consensus_unstake')
      .account(nominator)
      .account(validator)
      .amount(amount)
      .finish(nonce);
  },

  drc369Transfer(tokenId: string, from: string, to: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('drc369_transfer')
      .text(tokenId)
      .account(from)
      .account(to)
      .finish(nonce);
  },

  drc369SetState(tokenId: string, path: string, value: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('drc369_setState')
      .text(tokenId)
      .text(path)
      .text(value)
      .finish(nonce);
  },

  drc369SetPhysics(tokenId: string, physicsJson: string, nonce: number | bigint): Uint8Array {
    return new SigningPayload('drc369_setPhysics')
      .text(tokenId)
      .text(physicsJson)
      .finish(nonce);
  },

  drc369SetRoyalty(
    tokenId: string,
    recipient: string,
    percentageBps: number,
    nonce: number | bigint,
  ): Uint8Array {
    return new SigningPayload('drc369_setRoyalty')
      .text(tokenId)
      .account(recipient)
      .num16(percentageBps)
      .finish(nonce);
  },
};
