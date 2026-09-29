'use client';

const STORAGE_KEY = 'qor_wallet_encrypted_mnemonic_v1';

type WalletWasm = {
  generate_mnemonic: () => string;
  validate_mnemonic: (mnemonic: string) => boolean;
  encrypt_mnemonic: (mnemonic: string, password: string) => string;
  decrypt_mnemonic: (payload: string, password: string) => string;
};

let walletWasmPromise: Promise<WalletWasm> | null = null;

async function loadWalletWasm(): Promise<WalletWasm> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet WASM is only available in the browser');
  }

  if (!walletWasmPromise) {
    // Use standard dynamic import - Next.js will handle this correctly
    walletWasmPromise = (async () => {
      try {
        // Dynamic import using standard syntax
        // @ts-ignore - wallet-wasm may not be built yet
        const wasm = await import('@demiurge/wallet-wasm');
        return wasm as WalletWasm;
      } catch (error) {
        // Fallback: wallet-wasm may not be built yet, use stub implementation
        console.warn('wallet-wasm not available, using stub implementation:', error);
        return {
          generate_mnemonic: () => { throw new Error('wallet-wasm not built'); },
          validate_mnemonic: () => false,
          encrypt_mnemonic: () => { throw new Error('wallet-wasm not built'); },
          decrypt_mnemonic: () => { throw new Error('wallet-wasm not built'); },
        };
      }
    })();
  }

  return walletWasmPromise;
}

export function hasStoredWallet(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export async function createStoredWallet(password: string): Promise<string> {
  if (!password) {
    throw new Error('Wallet password is required');
  }

  const walletWasm = await loadWalletWasm();
  const mnemonic = walletWasm.generate_mnemonic();
  const encrypted = walletWasm.encrypt_mnemonic(mnemonic, password);

  localStorage.setItem(STORAGE_KEY, encrypted);
  return mnemonic;
}

export async function loadStoredWalletMnemonic(password: string): Promise<string> {
  if (!password) {
    throw new Error('Wallet password is required');
  }

  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) {
    throw new Error('Wallet not found');
  }

  const walletWasm = await loadWalletWasm();
  return walletWasm.decrypt_mnemonic(payload, password);
}

export function clearStoredWallet(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
