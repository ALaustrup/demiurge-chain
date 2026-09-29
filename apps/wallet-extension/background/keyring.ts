// Demiurge Wallet Extension - Secure Key Management
// Uses PBKDF2 + AES-256-GCM for encryption

import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { Account, EncryptedKeystore } from '../shared/types';

// Configure ed25519 to use sha512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
}

export class Keyring {
  private decryptedKeys: Map<string, Uint8Array> = new Map();
  private sessionKey: Uint8Array | null = null;
  private lockTimeout: ReturnType<typeof setTimeout> | null = null;
  private autoLockMinutes = 15;

  // Generate a new mnemonic phrase
  generateMnemonic(): string {
    return generateMnemonic(wordlist, 128); // 12 words
  }

  // Validate a mnemonic phrase
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic, wordlist);
  }

  // Derive a keypair from mnemonic + derivation index
  deriveKeyPair(mnemonic: string, index: number = 0): KeyPair {
    const seed = mnemonicToSeedSync(mnemonic);
    
    // Derive path: m/44'/369'/0'/0/index (369 = Demiurge coin type)
    const path = `Demiurge:${index}`;
    const derived = sha256(new Uint8Array([...seed, ...new TextEncoder().encode(path)]));
    
    const privateKey = derived.slice(0, 32);
    const publicKey = ed25519.getPublicKey(privateKey);
    const address = bytesToHex(publicKey);
    
    return { privateKey, publicKey, address };
  }

  // Encrypt a private key with password
  async encryptPrivateKey(privateKey: Uint8Array, password: string): Promise<EncryptedKeystore> {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    
    // Derive encryption key using PBKDF2
    const key = pbkdf2(sha256, password, salt, { c: PBKDF2_ITERATIONS, dkLen: 32 });
    
    // Encrypt with AES-256-GCM
    const cipher = gcm(key, iv);
    const ciphertext = cipher.encrypt(privateKey);
    
    // Calculate MAC for integrity
    const mac = bytesToHex(sha256(new Uint8Array([...key, ...ciphertext])));
    
    const publicKey = ed25519.getPublicKey(privateKey);
    
    return {
      version: 1,
      address: bytesToHex(publicKey),
      crypto: {
        cipher: 'aes-256-gcm',
        ciphertext: bytesToHex(ciphertext),
        cipherparams: { iv: bytesToHex(iv) },
        kdf: 'pbkdf2',
        kdfparams: {
          iterations: PBKDF2_ITERATIONS,
          salt: bytesToHex(salt),
        },
        mac,
      },
    };
  }

  // Decrypt a private key with password
  async decryptPrivateKey(keystore: EncryptedKeystore, password: string): Promise<Uint8Array> {
    const salt = hexToBytes(keystore.crypto.kdfparams.salt);
    const iv = hexToBytes(keystore.crypto.cipherparams.iv);
    const ciphertext = hexToBytes(keystore.crypto.ciphertext);
    
    // Derive key
    const key = pbkdf2(sha256, password, salt, { 
      c: keystore.crypto.kdfparams.iterations, 
      dkLen: 32 
    });
    
    // Verify MAC
    const expectedMac = bytesToHex(sha256(new Uint8Array([...key, ...ciphertext])));
    if (expectedMac !== keystore.crypto.mac) {
      throw new Error('Invalid password or corrupted keystore');
    }
    
    // Decrypt
    const cipher = gcm(key, iv);
    const privateKey = cipher.decrypt(ciphertext);
    
    return privateKey;
  }

  // Unlock the keyring with password
  async unlock(keystores: EncryptedKeystore[], password: string): Promise<void> {
    this.decryptedKeys.clear();
    
    for (const keystore of keystores) {
      try {
        const privateKey = await this.decryptPrivateKey(keystore, password);
        this.decryptedKeys.set(keystore.address, privateKey);
      } catch (e) {
        // Clear all keys if any fail
        this.decryptedKeys.clear();
        throw new Error('Failed to unlock wallet: invalid password');
      }
    }
    
    // Store session key for re-encryption
    this.sessionKey = pbkdf2(sha256, password, new TextEncoder().encode('session'), { c: 1000, dkLen: 32 });
    
    // Set auto-lock timer
    this.resetLockTimer();
  }

  // Lock the keyring
  lock(): void {
    // Securely clear all keys
    for (const key of this.decryptedKeys.values()) {
      key.fill(0);
    }
    this.decryptedKeys.clear();
    
    if (this.sessionKey) {
      this.sessionKey.fill(0);
      this.sessionKey = null;
    }
    
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
  }

  // Check if unlocked
  isUnlocked(): boolean {
    return this.decryptedKeys.size > 0;
  }

  // Reset the auto-lock timer
  private resetLockTimer(): void {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }
    
    this.lockTimeout = setTimeout(() => {
      this.lock();
    }, this.autoLockMinutes * 60 * 1000);
  }

  // Sign a message with the specified account
  async signMessage(address: string, message: Uint8Array): Promise<Uint8Array> {
    const privateKey = this.decryptedKeys.get(address);
    if (!privateKey) {
      throw new Error('Account not found or wallet is locked');
    }
    
    this.resetLockTimer();
    
    // Sign with ed25519
    const signature = await ed25519.signAsync(message, privateKey);
    return signature;
  }

  // Get all unlocked addresses
  getAddresses(): string[] {
    return Array.from(this.decryptedKeys.keys());
  }

  // Set auto-lock timeout
  setAutoLockMinutes(minutes: number): void {
    this.autoLockMinutes = minutes;
    if (this.isUnlocked()) {
      this.resetLockTimer();
    }
  }
}

// Singleton instance
export const keyring = new Keyring();
