/**
 * WASM Wallet Service
 * 
 * Provides browser-based wallet signing using WebAssembly
 * Integrates with QOR ID for deterministic keypair generation
 */

import { hexToU8a, u8aToHex } from '@polkadot/util';

// Dynamic imports for WASM module
let init: any;
let generate_keypair_from_seed: any;
let sign_message: any;
let get_address_from_keypair: any;

let wasmInitialized = false;
let wasmModule: any = null;

/**
 * Load WASM module functions dynamically
 * Returns false if module is not available (non-blocking)
 */
async function loadWasmModule(): Promise<boolean> {
  if (init && generate_keypair_from_seed && sign_message && get_address_from_keypair) {
    return true; // Already loaded
  }

  // Only try to load in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Try importing from the built package (dynamic import to avoid build-time resolution)
    // Use string concatenation to prevent TypeScript from statically analyzing the import
    const wasmModule = await import('@demiurge/' + 'wallet-wasm').catch(() => null);
    if (wasmModule) {
      init = wasmModule.default;
      generate_keypair_from_seed = wasmModule.generate_keypair_from_seed;
      sign_message = wasmModule.sign_message;
      get_address_from_keypair = wasmModule.get_address_from_keypair;
      return true;
    }
  } catch (error) {
    // Silently fail - module not available
  }

  try {
    // Fallback: try loading from relative path (for development)
    // Use string concatenation to prevent TypeScript from statically analyzing the import
    const wasmPath = '../../packages/wallet-wasm/pkg/wallet_wasm';
    const wasmModule = await import(wasmPath as any).catch(() => null);
    if (wasmModule) {
      init = wasmModule.default;
      generate_keypair_from_seed = wasmModule.generate_keypair_from_seed;
      sign_message = wasmModule.sign_message;
      get_address_from_keypair = wasmModule.get_address_from_keypair;
      return true;
    }
  } catch (fallbackError) {
    // Silently fail - module not available
  }

  return false;
}

/**
 * Initialize WASM module
 * Returns false if WASM is not available (non-blocking)
 */
export async function initWasm(): Promise<boolean> {
  if (wasmInitialized && wasmModule) {
    return true;
  }

  // Try to load WASM module functions first
  const loaded = await loadWasmModule();
  if (!loaded || !init) {
    return false; // WASM module not available, but don't throw error
  }

  try {
    // Try to load WASM binary from public directory
    try {
      const wasmModulePath = '/pkg/wallet_wasm_bg.wasm';
      const wasmModuleResponse = await fetch(wasmModulePath);
      
      if (wasmModuleResponse.ok) {
        const wasmBytes = await wasmModuleResponse.arrayBuffer();
        wasmModule = await init(wasmBytes);
      } else {
        // Fallback: try direct initialization
        wasmModule = await init();
      }
    } catch (fetchError) {
      // Final fallback: try direct initialization (may not work in all environments)
      try {
        wasmModule = await init();
      } catch (directError) {
        // WASM not available, return false instead of throwing
        return false;
      }
    }
    
    wasmInitialized = true;
    return true;
  } catch (error) {
    // WASM not available, return false instead of throwing
    return false;
  }
}

/**
 * Generate keypair from QOR ID seed
 * 
 * @param qorId QOR ID (e.g., "username#0001")
 * @returns Keypair JSON string
 */
export async function generateKeypairFromQorId(qorId: string): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available. Please ensure the wallet-wasm package is built.');
  }
  
  // Use same seed format as qor-wallet.ts
  const seed = `QOR_ID:${qorId}`;
  
  try {
    return generate_keypair_from_seed(seed);
  } catch (error) {
    console.error('Failed to generate keypair from QOR ID:', error);
    throw new Error('Failed to generate keypair');
  }
}

/**
 * Get public key hex from keypair JSON
 * 
 * @param keypairJson Keypair JSON string
 * @returns Public key as hex string
 */
export async function getPublicKeyHex(keypairJson: string): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    return get_address_from_keypair(keypairJson);
  } catch (error) {
    console.error('Failed to get public key:', error);
    throw new Error('Failed to extract public key');
  }
}

/**
 * Sign a message with keypair
 * 
 * @param keypairJson Keypair JSON string
 * @param message Message bytes to sign
 * @returns Signature as hex string
 */
export async function signMessage(
  keypairJson: string,
  message: Uint8Array
): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    return sign_message(keypairJson, message);
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Sign a transaction payload for Polkadot.js API
 * 
 * This creates a signature compatible with Substrate transaction signing
 * 
 * @param keypairJson Keypair JSON string
 * @param payload Transaction payload bytes
 * @returns Signature as hex string (64 bytes)
 */
export async function signTransactionPayload(
  keypairJson: string,
  payload: Uint8Array
): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    // Sign the payload
    const signatureHex = sign_message(keypairJson, payload);
    
    // Ensure signature is 64 bytes (128 hex chars)
    const signatureBytes = hexToU8a(signatureHex);
    if (signatureBytes.length !== 64) {
      throw new Error(`Invalid signature length: ${signatureBytes.length}, expected 64`);
    }
    
    return signatureHex;
  } catch (error) {
    console.error('Failed to sign transaction payload:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Create a custom signer for Polkadot.js API
 * 
 * This allows using WASM signing with Polkadot.js API
 */
export function createWasmSigner(keypairJson: string) {
  return {
    sign: async (payload: { data: Uint8Array }): Promise<{ signature: string }> => {
      const signature = await signTransactionPayload(keypairJson, payload.data);
      return { signature };
    }
  };
}

/**
 * Store keypair securely in localStorage (encrypted)
 * 
 * @param qorId QOR ID
 * @param keypairJson Keypair JSON string
 * @param password Encryption password
 */
export async function storeKeypair(
  qorId: string,
  keypairJson: string,
  password: string
): Promise<void> {
  const storageKey = `wasm_keypair_${qorId}`;

  // Derive encryption key from password using PBKDF2
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt the keypair JSON
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(keypairJson)
  );

  // Store salt + iv + ciphertext as base64
  const payload = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  localStorage.setItem(storageKey, btoa(String.fromCharCode(...payload)));
}

/**
 * Load stored keypair from localStorage
 * 
 * @param qorId QOR ID
 * @param password Decryption password
 * @returns Keypair JSON string
 */
export async function loadKeypair(
  qorId: string,
  password: string
): Promise<string | null> {
  const storageKey = `wasm_keypair_${qorId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    return await generateKeypairFromQorId(qorId);
  }

  try {
    // Decode base64 payload
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const ciphertext = raw.slice(28);

    // Derive decryption key
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    // Fallback: may be a legacy unencrypted value
    try {
      JSON.parse(stored);
      return stored;
    } catch {
      return null;
    }
  }
}

/**
 * Check if WASM wallet is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInitialized && wasmModule !== null;
}
