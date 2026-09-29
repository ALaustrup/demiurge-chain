/**
 * Utility functions for the Demiurge SDK
 */

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encode a transaction for submission
 */
export function encodeTransaction(tx: TransactionData): Uint8Array {
  // SCALE-like encoding (simplified)
  const encoder = new ScaleEncoder();
  
  // Encode from address (32 bytes)
  encoder.writeBytes(hexToBytes(tx.from));
  
  // Encode nonce (u64)
  encoder.writeU64(tx.nonce);
  
  // Encode transaction data
  encoder.writeBytes(tx.data);
  
  return encoder.toBytes();
}

/**
 * Decode a transaction
 */
export function decodeTransaction(bytes: Uint8Array): TransactionData {
  const decoder = new ScaleDecoder(bytes);
  
  return {
    from: bytesToHex(decoder.readBytes(32)),
    nonce: decoder.readU64(),
    data: decoder.readBytes(decoder.remaining()),
  };
}

/**
 * Transaction data structure
 */
export interface TransactionData {
  from: string;
  nonce: number;
  data: Uint8Array;
}

/**
 * Simple SCALE encoder
 */
class ScaleEncoder {
  private parts: Uint8Array[] = [];
  
  writeU8(value: number): void {
    this.parts.push(new Uint8Array([value & 0xff]));
  }
  
  writeU32(value: number): void {
    const bytes = new Uint8Array(4);
    bytes[0] = value & 0xff;
    bytes[1] = (value >> 8) & 0xff;
    bytes[2] = (value >> 16) & 0xff;
    bytes[3] = (value >> 24) & 0xff;
    this.parts.push(bytes);
  }
  
  writeU64(value: number): void {
    // Split into two u32s (JavaScript doesn't support full u64)
    this.writeU32(value >>> 0);
    this.writeU32(Math.floor(value / 0x100000000) >>> 0);
  }
  
  writeBytes(bytes: Uint8Array): void {
    // Length-prefixed bytes (compact encoding)
    this.writeCompact(bytes.length);
    this.parts.push(bytes);
  }
  
  writeCompact(value: number): void {
    if (value < 64) {
      this.writeU8(value << 2);
    } else if (value < 0x4000) {
      this.writeU8(((value << 2) & 0xff) | 0x01);
      this.writeU8((value >> 6) & 0xff);
    } else if (value < 0x40000000) {
      this.writeU8(((value << 2) & 0xff) | 0x02);
      this.writeU8((value >> 6) & 0xff);
      this.writeU8((value >> 14) & 0xff);
      this.writeU8((value >> 22) & 0xff);
    } else {
      throw new Error('Value too large for compact encoding');
    }
  }
  
  toBytes(): Uint8Array {
    const totalLength = this.parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of this.parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }
}

/**
 * Simple SCALE decoder
 */
class ScaleDecoder {
  private offset = 0;
  
  constructor(private data: Uint8Array) {}
  
  readU8(): number {
    if (this.offset >= this.data.length) {
      throw new Error('Unexpected end of data');
    }
    return this.data[this.offset++];
  }
  
  readU32(): number {
    const bytes = this.readBytes(4);
    return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  }
  
  readU64(): number {
    const low = this.readU32() >>> 0;
    const high = this.readU32() >>> 0;
    return low + high * 0x100000000;
  }
  
  readBytes(length: number): Uint8Array {
    if (this.offset + length > this.data.length) {
      throw new Error('Unexpected end of data');
    }
    const bytes = this.data.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }
  
  readCompact(): number {
    const first = this.readU8();
    const mode = first & 0x03;
    
    switch (mode) {
      case 0:
        return first >> 2;
      case 1: {
        const second = this.readU8();
        return ((first >> 2) | (second << 6));
      }
      case 2: {
        const bytes = this.readBytes(3);
        return ((first >> 2) | (bytes[0] << 6) | (bytes[1] << 14) | (bytes[2] << 22));
      }
      default:
        throw new Error('Big integer compact encoding not supported');
    }
  }
  
  remaining(): number {
    return this.data.length - this.offset;
  }
}

/**
 * Format balance for display (with decimals)
 */
export function formatBalance(balance: string | number, decimals = 2): string {
  const value = typeof balance === 'string' ? BigInt(balance) : BigInt(balance);
  const divisor = BigInt(100); // CGT has 2 decimal places (Sparks)
  
  const whole = value / divisor;
  const fractional = value % divisor;
  
  return `${whole}.${fractional.toString().padStart(decimals, '0')}`;
}

/**
 * Parse balance from display format
 */
export function parseBalance(display: string): string {
  const parts = display.split('.');
  const whole = BigInt(parts[0] || '0');
  const fractional = BigInt((parts[1] || '0').padEnd(2, '0').slice(0, 2));
  
  return (whole * 100n + fractional).toString();
}
