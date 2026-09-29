/**
 * Treasury Service
 * 
 * Handles server-side CGT transfers from the platform treasury.
 * Used for donor rewards, game prizes, and other platform distributions.
 */

import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { blockchainClient } from './blockchain';

const TREASURY_SEED = process.env.TREASURY_SEED;

class TreasuryService {
  private keyring: Keyring | null = null;
  private treasuryPair: KeyringPair | null = null;
  private initialized = false;

  /**
   * Initialize the treasury keypair from seed
   */
  private async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.treasuryPair !== null;
    }

    if (!TREASURY_SEED) {
      console.warn('[Treasury] TREASURY_SEED not configured - CGT distributions disabled');
      this.initialized = true;
      return false;
    }

    try {
      // Create keyring and add treasury account
      this.keyring = new Keyring({ type: 'sr25519' });
      this.treasuryPair = this.keyring.addFromMnemonic(TREASURY_SEED);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[Treasury] Failed to initialize:', error);
      this.initialized = true;
      return false;
    }
  }

  /**
   * Get treasury address
   */
  async getAddress(): Promise<string | null> {
    await this.initialize();
    return this.treasuryPair?.address || null;
  }

  /**
   * Transfer CGT from treasury to a recipient
   * 
   * @param toAddress Recipient's blockchain address
   * @param amount Amount in CGT (not smallest units)
   * @param reason Reason for transfer (for logging)
   * @returns Transaction hash or null if failed
   */
  async transferCGT(
    toAddress: string,
    amount: number,
    reason: string
  ): Promise<string | null> {
    const ready = await this.initialize();
    
    if (!ready || !this.treasuryPair) {
      console.error('[Treasury] Cannot transfer - treasury not initialized');
      return null;
    }

    try {
      // Connect to blockchain if needed
      await blockchainClient.connect();
      
      if (!blockchainClient.isConnected()) {
        console.error('[Treasury] Cannot transfer - blockchain not connected');
        return null;
      }

      // Convert CGT to smallest units (100 Sparks = 1 CGT)
      const amountInSmallestUnits = Math.floor(amount * 100).toString();

      // Execute transfer
      const txHash = await blockchainClient.transferCGT(
        this.treasuryPair,
        toAddress,
        amountInSmallestUnits
      );

      return txHash;
    } catch (error: any) {
      console.error('[Treasury] Transfer failed:', error.message || error);
      return null;
    }
  }

  /**
   * Check treasury balance
   */
  async getBalance(): Promise<number> {
    const ready = await this.initialize();
    
    if (!ready || !this.treasuryPair) {
      return 0;
    }

    try {
      await blockchainClient.connect();
      const balanceRaw = await blockchainClient.getCGTBalance(this.treasuryPair.address);
      // Convert from smallest units to CGT
      return parseInt(balanceRaw) / 100;
    } catch (error) {
      console.error('[Treasury] Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Check if treasury is available
   */
  async isAvailable(): Promise<boolean> {
    const ready = await this.initialize();
    return ready && this.treasuryPair !== null;
  }
}

// Export singleton
export const treasury = new TreasuryService();
