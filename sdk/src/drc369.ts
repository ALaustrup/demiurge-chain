/**
 * DRC-369 - Dynamic NFT Standard
 * 
 * Features:
 * - Dynamic state that can change over time
 * - Soulbound tokens (non-transferable)
 * - Token nesting (parent/child relationships)
 * - Delegation with fine-grained permissions
 * - Multi-resource tokens
 * - CVP protection for security
 */

import type { DemiurgeClient } from './client';
import type { Address, TokenId, Balance } from './types';

/**
 * Token information
 */
export interface TokenInfo {
  tokenId: string;
  owner: Address;
  tokenUri?: string;
  isSoulbound: boolean;
  parentTokenId?: string;
  cvpProtected: boolean;
}

/**
 * Dynamic state entry
 */
export interface DynamicState {
  key: string;
  value: string;
}

/**
 * State tree result from getStateTree
 */
export interface StateTree {
  tokenId: string;
  pathPrefix: string;
  entries: StateTreeEntry[];
  totalCount: number;
}

/**
 * Single entry in a state tree
 */
export interface StateTreeEntry {
  path: string;
  value: string;
  valueType: string;
}

/**
 * Batch query result
 */
export interface StateBatchResult {
  path: string;
  value: string | null;
}

/**
 * Optimistic update result
 */
export interface OptimisticResult {
  txHash: string;
  optimisticValue: string;
  status: 'pending' | 'confirmed' | 'failed';
  estimatedConfirmationMs: number;
}

/**
 * DRC-369 NFT interface
 */
export class DRC369 {
  constructor(private client: DemiurgeClient) {}

  // ============ Query Methods ============

  /**
   * Get token owner
   */
  async ownerOf(tokenId: TokenId): Promise<Address | null> {
    return this.client.call<Address | null>('drc369_ownerOf', [
      this.normalizeTokenId(tokenId),
    ]);
  }

  /**
   * Get token balance for an address
   */
  async balanceOf(owner: Address): Promise<Balance> {
    return this.client.call<Balance>('drc369_balanceOf', [owner]);
  }

  /**
   * Get token URI/metadata
   */
  async tokenUri(tokenId: TokenId): Promise<string | null> {
    return this.client.call<string | null>('drc369_tokenUri', [
      this.normalizeTokenId(tokenId),
    ]);
  }

  /**
   * Check if token is soulbound
   */
  async isSoulbound(tokenId: TokenId): Promise<boolean> {
    return this.client.call<boolean>('drc369_isSoulbound', [
      this.normalizeTokenId(tokenId),
    ]);
  }

/**
   * Get dynamic state for a token
   * 
   * Supports path notation (e.g., "stats/damage") or hex keys.
   */
  async getDynamicState(tokenId: TokenId, path: string): Promise<string | null> {
    return this.client.call<string | null>('drc369_getDynamicState', [
      this.normalizeTokenId(tokenId),
      path,
    ]);
  }
  
  /**
   * Get entire state tree under a path
   * 
   * Useful for loading all stats, visual properties, etc.
   * @example
   * const visualState = await nft.getStateTree(tokenId, 'visual/');
   */
  async getStateTree(tokenId: TokenId, pathPrefix: string): Promise<StateTree> {
    return this.client.call<StateTree>('drc369_getStateTree', [
      this.normalizeTokenId(tokenId),
      pathPrefix,
    ]);
  }
  
  /**
   * Batch get multiple state values efficiently
   * 
   * Critical for game engine performance - single round-trip for multiple values.
   * @example
   * const [damage, durability, glow] = await nft.getStateBatch(tokenId, [
   *   'stats/damage',
   *   'stats/durability', 
   *   'visual/effects/glow/enabled'
   * ]);
   */
  async getStateBatch(tokenId: TokenId, paths: string[]): Promise<StateBatchResult[]> {
    return this.client.call<StateBatchResult[]>('drc369_getStateBatch', [
      this.normalizeTokenId(tokenId),
      paths,
    ]);
  }
  
  /**
   * Set state with optimistic update
   * 
   * Returns immediately with optimistic result. The game can apply the change
   * locally and reconcile when the transaction confirms.
   * 
   * @example
   * const result = await nft.setStateOptimistic(tokenId, 'stats/durability', '80', signature);
   * // Game immediately shows durability = 80
   * // Background: transaction confirms or rolls back
   */
  async setStateOptimistic(
    tokenId: TokenId,
    path: string,
    value: string,
    signature: string
  ): Promise<OptimisticResult> {
    return this.client.call<OptimisticResult>('drc369_setStateOptimistic', [
      this.normalizeTokenId(tokenId),
      path,
      value,
      signature,
    ]);
  }

  /**
   * Get full token information
   */
  async getTokenInfo(tokenId: TokenId): Promise<TokenInfo | null> {
    const result = await this.client.call<TokenInfo | null>('drc369_getTokenInfo', [
      this.normalizeTokenId(tokenId),
    ]);
    
    if (!result) return null;
    
    return {
      tokenId: result.tokenId,
      owner: result.owner,
      tokenUri: result.tokenUri,
      isSoulbound: result.isSoulbound,
      parentTokenId: result.parentTokenId,
      cvpProtected: result.cvpProtected,
    };
  }

  /**
   * Get total supply of tokens
   */
  async totalSupply(): Promise<Balance> {
    return this.client.call<Balance>('drc369_totalSupply');
  }

  // ============ Transaction Methods ============

  /**
   * Build a mint transaction
   * 
   * @param to - Recipient address
   * @param tokenUri - Token metadata URI
   * @param soulbound - Whether token is non-transferable
   */
  buildMintTx(to: Address, tokenUri: string, soulbound = false): MintTransaction {
    return {
      type: 'drc369_mint',
      to,
      tokenUri,
      soulbound,
    };
  }

  /**
   * Build a transfer transaction
   */
  buildTransferTx(to: Address, tokenId: TokenId): TransferTransaction {
    return {
      type: 'drc369_transfer',
      to,
      tokenId: this.normalizeTokenId(tokenId),
    };
  }

  /**
   * Build an approve transaction
   */
  buildApproveTx(approved: Address, tokenId: TokenId): ApproveTransaction {
    return {
      type: 'drc369_approve',
      approved,
      tokenId: this.normalizeTokenId(tokenId),
    };
  }

  /**
   * Build a set dynamic state transaction
   */
  buildSetDynamicStateTx(tokenId: TokenId, key: string, value: string): SetDynamicStateTransaction {
    return {
      type: 'drc369_setDynamicState',
      tokenId: this.normalizeTokenId(tokenId),
      key,
      value,
    };
  }

  /**
   * Build a delegate transaction
   */
  buildDelegateTx(tokenId: TokenId, delegatee: Address, permissions: string[]): DelegateTransaction {
    return {
      type: 'drc369_delegate',
      tokenId: this.normalizeTokenId(tokenId),
      delegatee,
      permissions,
    };
  }

  /**
   * Build a nest transaction (child under parent)
   */
  buildNestTx(childTokenId: TokenId, parentTokenId: TokenId): NestTransaction {
    return {
      type: 'drc369_nest',
      childTokenId: this.normalizeTokenId(childTokenId),
      parentTokenId: this.normalizeTokenId(parentTokenId),
    };
  }

  /**
   * Build an unnest transaction
   */
  buildUnnestTx(tokenId: TokenId): UnnestTransaction {
    return {
      type: 'drc369_unnest',
      tokenId: this.normalizeTokenId(tokenId),
    };
  }

  /**
   * Build a burn transaction
   */
  buildBurnTx(tokenId: TokenId): BurnTransaction {
    return {
      type: 'drc369_burn',
      tokenId: this.normalizeTokenId(tokenId),
    };
  }

  // ============ Helpers ============

  private normalizeTokenId(tokenId: TokenId): string {
    if (typeof tokenId === 'number') {
      return tokenId.toString();
    }
    return tokenId;
  }
}

// Transaction types
export interface MintTransaction {
  type: 'drc369_mint';
  to: Address;
  tokenUri: string;
  soulbound: boolean;
}

export interface TransferTransaction {
  type: 'drc369_transfer';
  to: Address;
  tokenId: string;
}

export interface ApproveTransaction {
  type: 'drc369_approve';
  approved: Address;
  tokenId: string;
}

export interface SetDynamicStateTransaction {
  type: 'drc369_setDynamicState';
  tokenId: string;
  key: string;
  value: string;
}

export interface DelegateTransaction {
  type: 'drc369_delegate';
  tokenId: string;
  delegatee: Address;
  permissions: string[];
}

export interface NestTransaction {
  type: 'drc369_nest';
  childTokenId: string;
  parentTokenId: string;
}

export interface UnnestTransaction {
  type: 'drc369_unnest';
  tokenId: string;
}

export interface BurnTransaction {
  type: 'drc369_burn';
  tokenId: string;
}

export type DRC369Transaction =
  | MintTransaction
  | TransferTransaction
  | ApproveTransaction
  | SetDynamicStateTransaction
  | DelegateTransaction
  | NestTransaction
  | UnnestTransaction
  | BurnTransaction;
