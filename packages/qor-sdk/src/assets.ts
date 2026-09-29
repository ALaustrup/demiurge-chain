/**
 * DRC-369 Asset Management
 * 
 * Security Architecture:
 * - Cold-State Vault: Primary assets stored securely (linked to QOR ID)
 * - Shadow Proxy: Projected copies for games (not real assets)
 * - Metadata Resolver: Fetches asset metadata for interoperability
 */

export interface Drc369Asset {
  uuid: string;
  name: string;
  creatorQorId: string;
  assetType: 'virtual' | 'real-world' | 'hybrid';
  xpLevel: number;
  metadata: AssetMetadata;
  isSoulbound: boolean;
  owner: string;
  mintedAt: number;
}

export interface AssetMetadata {
  // Visual metadata
  ue5AssetPath?: string; // For virtual assets
  glassMaterial?: string;
  vfxSocket?: string;
  
  // Real-world metadata (encrypted)
  rwaData?: string; // Encrypted physical shipping/spec data
  
  // IPFS/Arweave storage
  ipfsHash?: string;
  arweaveId?: string;
  
  // Extended metadata
  description?: string;
  image?: string;
  attributes?: Record<string, any>;
}

export interface ShadowProxy {
  assetUuid: string;
  gameId: string;
  projectedAt: number;
  expiresAt: number;
  permissions: string[]; // ['view', 'use', 'trade']
}

/**
 * Asset Vault - Cold storage for primary assets
 */
export class AssetVault {
  private assets: Map<string, Drc369Asset> = new Map();
  
  /**
   * Store asset in vault (linked to QOR ID)
   */
  storeAsset(qorId: string, asset: Drc369Asset): void {
    this.assets.set(`${qorId}:${asset.uuid}`, asset);
  }
  
  /**
   * Retrieve asset from vault
   */
  getAsset(qorId: string, uuid: string): Drc369Asset | undefined {
    return this.assets.get(`${qorId}:${uuid}`);
  }
  
  /**
   * List all assets for a QOR ID
   */
  listAssets(qorId: string): Drc369Asset[] {
    const assets: Drc369Asset[] = [];
    for (const [key, asset] of this.assets.entries()) {
      if (key.startsWith(`${qorId}:`)) {
        assets.push(asset);
      }
    }
    return assets;
  }
}

/**
 * Shadow Proxy Manager - Manages projected copies for games
 */
export class ShadowProxyManager {
  private proxies: Map<string, ShadowProxy> = new Map();
  
  /**
   * Create a shadow proxy for a game
   */
  createProxy(assetUuid: string, gameId: string, duration: number = 3600000): ShadowProxy {
    const proxy: ShadowProxy = {
      assetUuid,
      gameId,
      projectedAt: Date.now(),
      expiresAt: Date.now() + duration,
      permissions: ['view', 'use'], // Default permissions
    };
    
    this.proxies.set(`${assetUuid}:${gameId}`, proxy);
    return proxy;
  }
  
  /**
   * Get shadow proxy for a game
   */
  getProxy(assetUuid: string, gameId: string): ShadowProxy | undefined {
    const proxy = this.proxies.get(`${assetUuid}:${gameId}`);
    if (proxy && proxy.expiresAt > Date.now()) {
      return proxy;
    }
    // Clean up expired proxy
    if (proxy) {
      this.proxies.delete(`${assetUuid}:${gameId}`);
    }
    return undefined;
  }
  
  /**
   * Revoke shadow proxy
   */
  revokeProxy(assetUuid: string, gameId: string): void {
    this.proxies.delete(`${assetUuid}:${gameId}`);
  }
}

/**
 * Metadata Resolver - Fetches asset metadata for interoperability
 */
export class MetadataResolver {
  private ipfsGateway: string;
  private arweaveGateway: string;
  
  constructor(ipfsGateway: string = 'https://ipfs.io/ipfs/', arweaveGateway: string = 'https://arweave.net/') {
    this.ipfsGateway = ipfsGateway;
    this.arweaveGateway = arweaveGateway;
  }
  
  /**
   * Resolve asset metadata from IPFS/Arweave
   */
  async resolveMetadata(asset: Drc369Asset): Promise<AssetMetadata> {
    // If metadata is already fully loaded (has description/image), return it
    if (asset.metadata && asset.metadata.description) {
      return asset.metadata;
    }
    
    // Try to fetch from IPFS if hash is available
    if (asset.metadata?.ipfsHash) {
      try {
        const response = await fetch(`${this.ipfsGateway}${asset.metadata.ipfsHash}`);
        const metadata = await response.json() as AssetMetadata;
        return metadata;
      } catch (error) {
        console.error('Failed to fetch from IPFS:', error);
      }
    }
    
    // Try to fetch from Arweave
    if (asset.metadata.arweaveId) {
      try {
        const response = await fetch(`${this.arweaveGateway}${asset.metadata.arweaveId}`);
        const metadata = await response.json() as AssetMetadata;
        return metadata;
      } catch (error) {
        console.error('Failed to fetch from Arweave:', error);
      }
    }
    
    // Return default metadata
    return asset.metadata || {};
  }
  
  /**
   * Check if asset is compatible with a game
   */
  isCompatible(asset: Drc369Asset, gameRequirements: string[]): boolean {
    // Check if asset has required attributes
    for (const requirement of gameRequirements) {
      if (!asset.metadata.attributes?.[requirement]) {
        return false;
      }
    }
    return true;
  }
}

// Export singletons
export const assetVault = new AssetVault();
export const shadowProxyManager = new ShadowProxyManager();
export const metadataResolver = new MetadataResolver();
