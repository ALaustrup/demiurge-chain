/**
 * Demiurge-Cloud Manager
 * 
 * Wraps the automatically-injected window.DemiurgeHUD API
 * Provides connection state management and fallback/mock mode
 * 
 * Copy this file into your Rosebud.AI game project
 */
class BlockchainManager {
  constructor(options = {}) {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    this.mockMode = options.mockMode || false; // Enable for development/testing
    this.onConnectionChange = options.onConnectionChange || null;
    
    // Check if HUD is available (injected by Demiurge Hub)
    this.hudAvailable = typeof window !== 'undefined' && window.DemiurgeHUD;
    
    if (!this.hudAvailable && !this.mockMode) {
      console.warn('DemiurgeHUD not available. Enable mockMode for development.');
    }
  }

  /**
   * Check if wallet is connected
   * @returns {Promise<boolean>}
   */
  async connectDemiurgeWallet() {
    if (this.mockMode) {
      // Mock mode for development
      this.isWalletConnected = true;
      this.qorId = 'mock_user_123';
      this.balance = '100000000000'; // 1000 CGT in smallest units
      this.assets = [];
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      return true;
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available. Game must be loaded in Demiurge Hub.');
    }

    try {
      // Get QOR ID to verify connection
      this.qorId = await window.DemiurgeHUD.getQORID();
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      this.assets = await window.DemiurgeHUD.getUserAssets();
      
      this.isWalletConnected = true;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.isWalletConnected = false;
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
      return false;
    }
  }

  /**
   * Get current CGT balance
   * @returns {Promise<string>} Balance in smallest units (2 decimals, 100 Sparks = 1 CGT)
   */
  async getDemiurgeBalance() {
    if (this.mockMode) {
      return this.balance || '100000000000'; // Mock: 1000 CGT
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      return this.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get balance as CGT (human-readable)
   * @returns {Promise<number>} Balance in CGT
   */
  async getBalanceInCGT() {
    const balanceStr = await this.getDemiurgeBalance();
    const balanceBigInt = BigInt(balanceStr);
    return Number(balanceBigInt) / 100; // 100 Sparks = 1 CGT
  }

  /**
   * Spend CGT (for in-game purchases)
   * @param {number} amount - Amount in CGT (will be converted to smallest units)
   * @param {string} reason - Reason for spending (e.g., 'upgrade_weapon')
   * @returns {Promise<string>} Transaction hash
   */
  async spendCGT(amount, reason = 'game_purchase') {
    if (this.mockMode) {
      // Mock transaction
      const currentBalance = BigInt(this.balance);
      const amountInSmallestUnits = BigInt(Math.floor(amount * 100)); // 100 Sparks = 1 CGT
      
      if (currentBalance < amountInSmallestUnits) {
        throw new Error('Insufficient balance');
      }
      
      this.balance = (currentBalance - amountInSmallestUnits).toString();
      return `0x${Math.random().toString(16).substr(2, 64)}`; // Mock tx hash
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      const amountInSmallestUnits = Math.floor(amount * 100); // 100 Sparks = 1 CGT
      const txHash = await window.DemiurgeHUD.spendCGT(amountInSmallestUnits, reason);
      
      // Update local balance
      await this.getDemiurgeBalance();
      
      return txHash;
    } catch (error) {
      console.error('Failed to spend CGT:', error);
      throw error;
    }
  }

  /**
   * Get user's DRC-369 assets (NFTs)
   * @returns {Promise<Array>} Array of asset objects with UUIDs
   * 
   * Note: Returns basic asset info (UUIDs). Use getAssetMetadata(uuid) for full details.
   */
  async getUserAssets() {
    if (this.mockMode) {
      return this.assets || [
        { uuid: 'mock_asset_001', name: 'Mock Weapon' },
        { uuid: 'mock_asset_002', name: 'Mock Shield' }
      ];
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.assets = await window.DemiurgeHUD.getUserAssets();
      return this.assets;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw error;
    }
  }

  /**
   * Get full metadata for a specific DRC-369 asset
   * @param {string} assetUuid - Asset UUID
   * @returns {Promise<Object>} Full asset metadata
   */
  async getAssetMetadata(assetUuid) {
    if (this.mockMode) {
      return {
        uuid: assetUuid,
        name: 'Mock Asset',
        creatorQorId: 'creator#0001',
        creatorAccount: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        assetType: 'virtual',
        xpLevel: 10,
        experiencePoints: 5000,
        durability: 100,
        killCount: 0,
        classId: 1,
        isSoulbound: false,
        royaltyFeePercent: 25,
        mintedAt: Date.now(),
        metadata: {
          description: 'A powerful asset',
          image: '/placeholder-nft.jpg',
          attributes: {
            attack: 100,
            defense: 50,
            rarity: 'rare'
          }
        }
      };
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      // Fetch metadata from backend API
      const response = await fetch(`/api/assets/${assetUuid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset metadata: ${response.status}`);
      }
      const data = await response.json();
      return data.asset || data;
    } catch (error) {
      console.error('Failed to get asset metadata:', error);
      throw error;
    }
  }

  /**
   * Get all user assets with full metadata
   * @returns {Promise<Array>} Array of full asset objects
   */
  async getUserAssetsWithMetadata() {
    const assets = await this.getUserAssets();
    const assetsWithMetadata = await Promise.all(
      assets.map(async (asset) => {
        try {
          const metadata = await this.getAssetMetadata(asset.uuid);
          return { ...asset, ...metadata };
        } catch (error) {
          console.warn(`Failed to fetch metadata for ${asset.uuid}:`, error);
          return asset; // Return basic asset if metadata fetch fails
        }
      })
    );
    return assetsWithMetadata;
  }

  /**
   * Check if user owns a specific asset
   * @param {string} assetUuid - Asset UUID to check
   * @returns {Promise<boolean>}
   */
  async ownsAsset(assetUuid) {
    if (this.mockMode) {
      return this.assets.some(asset => asset.uuid === assetUuid);
    }

    if (!this.hudAvailable) {
      return false;
    }

    try {
      return await window.DemiurgeHUD.ownsAsset(assetUuid);
    } catch (error) {
      console.error('Failed to check asset ownership:', error);
      return false;
    }
  }

  /**
   * Update user's XP (for leveling system)
   * @param {number} xp - XP to add
   * @param {string} source - Source of XP (e.g., 'level_complete', 'enemy_defeated')
   */
  updateAccountXP(xp, source = 'game') {
    if (this.mockMode) {
      console.log(`[MOCK] Would award ${xp} XP from ${source}`);
      return;
    }

    if (!this.hudAvailable) {
      console.warn('DemiurgeHUD not available, XP not updated');
      return;
    }

    try {
      window.DemiurgeHUD.updateAccountXP(xp, source);
    } catch (error) {
      console.error('Failed to update XP:', error);
    }
  }

  /**
   * Get user's QOR ID
   * @returns {Promise<string>}
   */
  async getQORID() {
    if (this.mockMode) {
      return this.qorId || 'mock_user_123';
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.qorId = await window.DemiurgeHUD.getQORID();
      return this.qorId;
    } catch (error) {
      console.error('Failed to get QOR ID:', error);
      throw error;
    }
  }

  /**
   * Send game state to blockchain (for achievements, leaderboards, etc.)
   * @param {Object} data - Game state data
   * @returns {Promise<string>} Transaction hash or state ID
   */
  async sendGameState(data) {
    if (this.mockMode) {
      console.log('[MOCK] Would send game state:', data);
      return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // For now, this is a placeholder
    // In the future, this could call a custom RPC endpoint
    // or use a specific blockchain extrinsic
    
    console.warn('sendGameState is not yet implemented. Use updateAccountXP for XP updates.');
    
    // You could extend this to:
    // - Store achievements on-chain
    // - Update leaderboard scores
    // - Record game events for analytics
    
    return null;
  }

  /**
   * Open social platform overlay
   */
  openSocial() {
    if (this.mockMode) {
      console.log('[MOCK] Would open social platform');
      return;
    }

    if (!this.hudAvailable) {
      console.warn('DemiurgeHUD not available');
      return;
    }

    try {
      window.DemiurgeHUD.openSocial();
    } catch (error) {
      console.error('Failed to open social:', error);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlockchainManager;
}
