/**
 * DRC-369 Handler
 * 
 * Handles interaction with DRC-369 stateful NFTs.
 * DRC-369 NFTs can store mutable on-chain state, enabling:
 * - Equipment/inventory systems
 * - Experience and leveling
 * - Evolution mechanics
 * - Cross-game asset interoperability
 */

import type { BlockchainBridge } from './BlockchainBridge';
import type { SessionKeyManager } from './SessionKeyManager';

/**
 * DRC-369 Game Asset
 */
export interface GameAsset {
  /** Unique token ID */
  id: string;
  /** Asset collection */
  collection: string;
  /** Asset metadata (name, description, image, etc.) */
  metadata: AssetMetadata;
  /** Mutable on-chain state */
  state: AssetState;
  /** Current equipped items (if this is a character) */
  equippedItems: string[];
  /** Asset statistics */
  stats: AssetStats;
  /** Evolution level */
  evolution: number;
  /** Owner QOR ID */
  owner: string;
}

/**
 * Asset metadata (immutable)
 */
export interface AssetMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Mutable asset state
 */
export interface AssetState {
  /** Experience points */
  xp: number;
  /** Current level */
  level: number;
  /** Custom state fields */
  custom: Record<string, unknown>;
  /** Last state update timestamp */
  lastUpdate: number;
}

/**
 * Asset statistics
 */
export interface AssetStats {
  /** Attack power */
  attack: number;
  /** Defense rating */
  defense: number;
  /** Speed/agility */
  speed: number;
  /** Health points */
  health: number;
  /** Special ability power */
  special: number;
  /** Custom stats */
  [key: string]: number;
}

/**
 * Evolution result
 */
export interface EvolutionResult {
  /** Whether evolution succeeded */
  success: boolean;
  /** New evolution level */
  newEvolution: number;
  /** New stats after evolution */
  newStats: AssetStats;
  /** New metadata (if visuals changed) */
  newMetadata?: Partial<AssetMetadata>;
  /** Transaction hash */
  txHash: string;
}

/**
 * DRC-369 Handler for game assets
 */
export class DRC369Handler {
  private blockchain: BlockchainBridge;
  private cache: Map<string, GameAsset> = new Map();

  constructor(blockchain: BlockchainBridge) {
    this.blockchain = blockchain;
  }

  /**
   * Load all game assets for a player
   */
  async loadPlayerAssets(qorId: string): Promise<GameAsset[]> {
    const assets = await this.blockchain.call<GameAsset[]>('drc369_getAssetsByOwner', {
      owner: qorId,
    });

    // Cache assets
    assets.forEach(asset => this.cache.set(asset.id, asset));

    return assets;
  }

  /**
   * Load a specific asset by ID
   */
  async loadAsset(tokenId: string): Promise<GameAsset> {
    // Check cache first
    if (this.cache.has(tokenId)) {
      return this.cache.get(tokenId)!;
    }

    const asset = await this.blockchain.call<GameAsset>('drc369_getToken', {
      tokenId,
    });

    this.cache.set(tokenId, asset);
    return asset;
  }

  /**
   * Update asset state (e.g., equip item, gain XP)
   */
  async updateAssetState(
    tokenId: string,
    changes: Record<string, unknown>,
    sessionKey: SessionKeyManager
  ): Promise<void> {
    if (!sessionKey.hasPermission('state_update')) {
      throw new Error('Session key does not have state_update permission');
    }

    // Sign the state change
    const signedAction = await sessionKey.signAction({
      type: 'DRC369_UPDATE_STATE',
      targetId: tokenId,
      data: changes,
      timestamp: Date.now(),
    });

    await this.blockchain.call('drc369_submitStateChange', {
      tokenId,
      changes,
      signature: signedAction.signature,
      sessionKeyId: signedAction.sessionKeyId,
    });

    // Update cache
    if (this.cache.has(tokenId)) {
      const asset = this.cache.get(tokenId)!;
      asset.state = {
        ...asset.state,
        ...changes,
        lastUpdate: Date.now(),
      };
    }
  }

  /**
   * Add experience to an asset
   */
  async addExperience(
    tokenId: string,
    xpAmount: number,
    sessionKey: SessionKeyManager
  ): Promise<{ newXp: number; leveledUp: boolean; newLevel: number }> {
    const result = await this.blockchain.call<{
      newXp: number;
      leveledUp: boolean;
      newLevel: number;
    }>('drc369_addExperience', {
      tokenId,
      amount: xpAmount,
      sessionKeyId: sessionKey.getSessionKey()?.id,
    });

    // Update cache
    if (this.cache.has(tokenId)) {
      const asset = this.cache.get(tokenId)!;
      asset.state.xp = result.newXp;
      asset.state.level = result.newLevel;
    }

    return result;
  }

  /**
   * Evolve an asset to the next form
   */
  async evolveAsset(
    tokenId: string,
    sessionKey: SessionKeyManager
  ): Promise<EvolutionResult> {
    if (!sessionKey.hasPermission('state_update')) {
      throw new Error('Session key does not have state_update permission');
    }

    const result = await this.blockchain.call<EvolutionResult>('drc369_evolve', {
      tokenId,
      sessionKeyId: sessionKey.getSessionKey()?.id,
    });

    // Update cache with new evolution data
    if (result.success && this.cache.has(tokenId)) {
      const asset = this.cache.get(tokenId)!;
      asset.evolution = result.newEvolution;
      asset.stats = result.newStats;
      if (result.newMetadata) {
        asset.metadata = { ...asset.metadata, ...result.newMetadata };
      }
    }

    return result;
  }

  /**
   * Equip an item to a character asset
   */
  async equipItem(
    characterId: string,
    itemId: string,
    slot: string,
    sessionKey: SessionKeyManager
  ): Promise<void> {
    await this.updateAssetState(characterId, {
      [`equipped_${slot}`]: itemId,
    }, sessionKey);

    // Update cache
    if (this.cache.has(characterId)) {
      const asset = this.cache.get(characterId)!;
      if (!asset.equippedItems.includes(itemId)) {
        asset.equippedItems.push(itemId);
      }
    }
  }

  /**
   * Unequip an item from a character
   */
  async unequipItem(
    characterId: string,
    slot: string,
    sessionKey: SessionKeyManager
  ): Promise<void> {
    const asset = await this.loadAsset(characterId);
    const itemId = asset.state.custom[`equipped_${slot}`] as string;

    await this.updateAssetState(characterId, {
      [`equipped_${slot}`]: null,
    }, sessionKey);

    // Update cache
    if (this.cache.has(characterId) && itemId) {
      const cached = this.cache.get(characterId)!;
      cached.equippedItems = cached.equippedItems.filter(id => id !== itemId);
    }
  }

  /**
   * Check if assets are compatible for combination
   */
  async checkCompatibility(assetIds: string[]): Promise<{
    compatible: boolean;
    reason?: string;
  }> {
    return this.blockchain.call('drc369_checkCompatibility', {
      assetIds,
    });
  }

  /**
   * Clear the asset cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached asset (if available)
   */
  getCached(tokenId: string): GameAsset | undefined {
    return this.cache.get(tokenId);
  }
}
