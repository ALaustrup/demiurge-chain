/**
 * Session Key Manager
 * 
 * Handles session key creation and action signing for seamless gameplay.
 * Session keys allow game actions to be signed without wallet popups.
 */

import type { BlockchainBridge } from './BlockchainBridge';
import type { GameAction, SignedAction } from '../types';

/**
 * Permission types for session keys
 */
export type SessionKeyPermission = 
  | 'game_actions'    // Record game actions
  | 'asset_transfer'  // Transfer DRC-369 assets
  | 'state_update'    // Update NFT state
  | 'cgt_spend';      // Spend CGT (with limits)

/**
 * Session key information
 */
export interface SessionKey {
  /** Unique session key ID */
  id: string;
  /** QOR ID this key belongs to */
  qorId: string;
  /** Granted permissions */
  permissions: SessionKeyPermission[];
  /** When the key expires (Unix timestamp) */
  expiresAt: number;
  /** Spending limit for CGT (if applicable) */
  spendingLimit?: string;
  /** Private key material (kept in memory only) */
  privateKey: CryptoKey;
}

/**
 * Session Key Manager
 * 
 * Creates and manages session keys for seamless gameplay without wallet popups.
 */
export class SessionKeyManager {
  private blockchain: BlockchainBridge;
  private sessionKey: SessionKey | null = null;

  constructor(blockchain: BlockchainBridge) {
    this.blockchain = blockchain;
  }

  /**
   * Authenticate and create a session key
   */
  async authenticate(
    qorId: string,
    permissions: SessionKeyPermission[] = ['game_actions'],
    expiresIn: number = 86400 // 24 hours
  ): Promise<SessionKey> {
    // Generate ephemeral key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export public key for registration
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyHex = Array.from(new Uint8Array(publicKeyRaw))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Register session key on-chain
    const result = await this.blockchain.call<{
      sessionKeyId: string;
      expiresAt: number;
    }>('sessionKeys_create', {
      qorId,
      publicKey: publicKeyHex,
      permissions,
      expiresIn,
    });

    this.sessionKey = {
      id: result.sessionKeyId,
      qorId,
      permissions,
      expiresAt: result.expiresAt,
      privateKey: keyPair.privateKey,
    };

    return this.sessionKey;
  }

  /**
   * Sign a game action with the session key
   */
  async signAction(action: GameAction): Promise<SignedAction> {
    if (!this.sessionKey) {
      throw new Error('No session key - call authenticate() first');
    }

    // Check expiration
    if (Date.now() > this.sessionKey.expiresAt * 1000) {
      throw new Error('Session key expired');
    }

    // Serialize action for signing
    const actionData = JSON.stringify({
      ...action,
      sessionKeyId: this.sessionKey.id,
    });
    const encoder = new TextEncoder();
    const data = encoder.encode(actionData);

    // Sign with session key
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.sessionKey.privateKey,
      data
    );

    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      ...action,
      signature: signatureHex,
      sessionKeyId: this.sessionKey.id,
    };
  }

  /**
   * Check if session key is valid and not expired
   */
  isValid(): boolean {
    if (!this.sessionKey) return false;
    return Date.now() < this.sessionKey.expiresAt * 1000;
  }

  /**
   * Get current session key info
   */
  getSessionKey(): SessionKey | null {
    return this.sessionKey;
  }

  /**
   * Check if a permission is granted
   */
  hasPermission(permission: SessionKeyPermission): boolean {
    return this.sessionKey?.permissions.includes(permission) ?? false;
  }

  /**
   * Revoke the current session key
   */
  async revoke(): Promise<void> {
    if (!this.sessionKey) return;

    await this.blockchain.call('sessionKeys_revoke', {
      sessionKeyId: this.sessionKey.id,
    });

    this.sessionKey = null;
  }
}
