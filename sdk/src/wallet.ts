/**
 * Wallet utilities for Demiurge-Cloud
 * 
 * Handles key generation, signing, and address derivation using Ed25519.
 */

import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { blake2b } from '@noble/hashes/blake2b';
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { bytesToHex, hexToBytes } from './utils';

// Configure ed25519 to use sha512 (required for synchronous operations)
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

/**
 * Key pair (public/private)
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Wallet creation options
 */
export interface WalletOptions {
  /** Derivation path index for HD wallets (default: 0) */
  accountIndex?: number;
}

/**
 * Mnemonic generation options
 */
export interface MnemonicOptions {
  /** Number of words: 12 or 24 (default: 12) */
  wordCount?: 12 | 24;
}

/**
 * Wallet for signing transactions using Ed25519
 */
export class Wallet {
  private keyPair: KeyPair | null = null;
  private _mnemonic: string | null = null;
  
  /**
   * Generate a new random wallet with a mnemonic phrase
   * @returns Wallet instance with generated mnemonic
   */
  static generate(options?: MnemonicOptions): Wallet {
    const strength = options?.wordCount === 24 ? 256 : 128; // 128 bits = 12 words, 256 bits = 24 words
    const mnemonic = generateMnemonic(wordlist, strength);
    return Wallet.fromMnemonic(mnemonic);
  }
  
  /**
   * Generate a wallet from raw entropy (no mnemonic)
   * Use this for programmatic wallet creation without seed phrase
   */
  static generateFromEntropy(): Wallet {
    const wallet = new Wallet();
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    
    wallet.keyPair = {
      privateKey,
      publicKey,
    };
    
    return wallet;
  }
  
  /**
   * Create wallet from private key
   * @param privateKeyHex - 32 byte private key as hex string
   */
  static fromPrivateKey(privateKeyHex: string): Wallet {
    const wallet = new Wallet();
    const privateKey = hexToBytes(privateKeyHex);
    
    if (privateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes');
    }
    
    // Derive public key using Ed25519
    const publicKey = ed25519.getPublicKey(privateKey);
    
    wallet.keyPair = {
      privateKey,
      publicKey,
    };
    
    return wallet;
  }
  
  /**
   * Create wallet from mnemonic (BIP39)
   * @param mnemonic - 12 or 24 word BIP39 mnemonic phrase
   * @param options - Optional wallet configuration
   */
  static fromMnemonic(mnemonic: string, options?: WalletOptions): Wallet {
    const normalizedMnemonic = mnemonic.trim().toLowerCase();
    
    if (!validateMnemonic(normalizedMnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    const wallet = new Wallet();
    wallet._mnemonic = normalizedMnemonic;
    
    // Convert mnemonic to seed (no password)
    const seed = mnemonicToSeedSync(normalizedMnemonic);
    
    // Derive Ed25519 key from seed
    // Use a simple derivation path for Demiurge: m/44'/999'/accountIndex'
    // We hash the seed with the account index to derive the private key
    const accountIndex = options?.accountIndex ?? 0;
    const derivationInput = new Uint8Array(seed.length + 4);
    derivationInput.set(seed);
    derivationInput[seed.length] = (accountIndex >> 24) & 0xff;
    derivationInput[seed.length + 1] = (accountIndex >> 16) & 0xff;
    derivationInput[seed.length + 2] = (accountIndex >> 8) & 0xff;
    derivationInput[seed.length + 3] = accountIndex & 0xff;
    
    // Use Blake2b to derive the private key from the seed + account index
    const privateKey = blake2b(derivationInput, { dkLen: 32 });
    const publicKey = ed25519.getPublicKey(privateKey);
    
    wallet.keyPair = {
      privateKey,
      publicKey,
    };
    
    return wallet;
  }
  
  /**
   * Validate a mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic.trim().toLowerCase(), wordlist);
  }
  
  /**
   * Generate a new mnemonic phrase without creating a wallet
   */
  static generateMnemonic(options?: MnemonicOptions): string {
    const strength = options?.wordCount === 24 ? 256 : 128;
    return generateMnemonic(wordlist, strength);
  }
  
  /**
   * Get the wallet address (same as public key in hex)
   */
  address(): string {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    return bytesToHex(this.keyPair.publicKey);
  }
  
  /**
   * Get the public key as hex string
   */
  publicKey(): string {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    return bytesToHex(this.keyPair.publicKey);
  }
  
  /**
   * Get the public key as Uint8Array
   */
  publicKeyBytes(): Uint8Array {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    return this.keyPair.publicKey;
  }
  
  /**
   * Export private key (use with caution!)
   */
  exportPrivateKey(): string {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    return bytesToHex(this.keyPair.privateKey);
  }
  
  /**
   * Export mnemonic phrase (use with caution!)
   * Only available if wallet was created from mnemonic
   */
  exportMnemonic(): string | null {
    return this._mnemonic;
  }
  
  /**
   * Check if wallet has an associated mnemonic
   */
  hasMnemonic(): boolean {
    return this._mnemonic !== null;
  }
  
  /**
   * Sign a message using Ed25519
   * @param message - Message bytes to sign
   * @returns 64-byte Ed25519 signature
   */
  sign(message: Uint8Array): Uint8Array {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    
    return ed25519.sign(message, this.keyPair.privateKey);
  }
  
  /**
   * Sign a message asynchronously
   * @param message - Message bytes to sign
   * @returns Promise resolving to 64-byte Ed25519 signature
   */
  async signAsync(message: Uint8Array): Promise<Uint8Array> {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    
    return ed25519.signAsync(message, this.keyPair.privateKey);
  }
  
  /**
   * Sign a hex-encoded message
   * @param messageHex - Message as hex string
   * @returns Signature as hex string
   */
  signHex(messageHex: string): string {
    const message = hexToBytes(messageHex);
    const signature = this.sign(message);
    return bytesToHex(signature);
  }
  
  /**
   * Sign a transaction and return the signed transaction bytes
   * @param txBytes - Transaction bytes
   * @returns Signed transaction (signature + transaction)
   */
  signTransaction(txBytes: Uint8Array): Uint8Array {
    const signature = this.sign(txBytes);
    
    // Combine: signature (64 bytes) + transaction
    const signed = new Uint8Array(64 + txBytes.length);
    signed.set(signature);
    signed.set(txBytes, 64);
    
    return signed;
  }
  
  /**
   * Sign a transaction and return separate signature and transaction
   * @param txBytes - Transaction bytes
   * @returns Object with signature and transaction
   */
  signTransactionSeparate(txBytes: Uint8Array): { signature: Uint8Array; transaction: Uint8Array } {
    return {
      signature: this.sign(txBytes),
      transaction: txBytes,
    };
  }
  
  /**
   * Verify that a signature was created by this wallet
   * @param message - Original message bytes
   * @param signature - 64-byte signature to verify
   */
  verify(message: Uint8Array, signature: Uint8Array): boolean {
    if (!this.keyPair) {
      throw new Error('Wallet not initialized');
    }
    
    return ed25519.verify(signature, message, this.keyPair.publicKey);
  }
}

/**
 * Verify a signature against a message and public key
 * @param message - Original message bytes
 * @param signature - 64-byte Ed25519 signature
 * @param publicKey - 32-byte Ed25519 public key
 * @returns True if signature is valid
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  if (signature.length !== 64) {
    throw new Error('Signature must be 64 bytes');
  }
  if (publicKey.length !== 32) {
    throw new Error('Public key must be 32 bytes');
  }
  
  return ed25519.verify(signature, message, publicKey);
}

/**
 * Verify a signature asynchronously
 */
export async function verifySignatureAsync(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  if (signature.length !== 64) {
    throw new Error('Signature must be 64 bytes');
  }
  if (publicKey.length !== 32) {
    throw new Error('Public key must be 32 bytes');
  }
  
  return ed25519.verifyAsync(signature, message, publicKey);
}

/**
 * Verify a hex-encoded signature
 * @param messageHex - Message as hex string
 * @param signatureHex - Signature as hex string
 * @param publicKeyHex - Public key as hex string
 */
export function verifySignatureHex(
  messageHex: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  return verifySignature(
    hexToBytes(messageHex),
    hexToBytes(signatureHex),
    hexToBytes(publicKeyHex)
  );
}

/**
 * Derive address from public key
 * In Demiurge, the address is the hex-encoded public key
 */
export function addressFromPublicKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new Error('Public key must be 32 bytes');
  }
  return bytesToHex(publicKey);
}

/**
 * Validate an address format
 */
export function isValidAddress(address: string): boolean {
  // Demiurge addresses are 64-character hex strings (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(address);
}

/**
 * Create a random address (for testing)
 */
export function randomAddress(): string {
  const wallet = Wallet.generateFromEntropy();
  return wallet.address();
}
