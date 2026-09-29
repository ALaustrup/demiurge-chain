/**
 * DemiurgeIntegration.js
 * 
 * DRC-369 NFT Integration for Demiurge Games
 * 
 * Features:
 * - Unlock in-game assets based on NFT ownership
 * - Mint soulbound achievement NFTs
 * - Cross-game interoperability
 * - Dynamic NFT state updates
 * 
 * Usage:
 * 1. Copy this file to your game folder
 * 2. Create assets/data/nft_assets.json (see template)
 * 3. Initialize: const demiurge = new DemiurgeIntegration('your-game-id');
 * 4. await demiurge.initialize();
 */

class DemiurgeIntegration {
  constructor(gameId, options = {}) {
    this.gameId = gameId;
    this.isConnected = false;
    this.userAddress = null;
    this.qorId = null;
    this.userNFT = null;
    this.unlockedAssets = {};
    this.assetConfig = null;
    
    // Callbacks
    this.onConnectionChange = options.onConnectionChange || (() => {});
    this.onAssetsLoaded = options.onAssetsLoaded || (() => {});
    this.onAchievementMinted = options.onAchievementMinted || (() => {});
    
    // Check if running in Demiurge Hub
    this.hubAvailable = typeof window !== 'undefined' && window.DemiurgeHUD;
    this.mockMode = options.mockMode || !this.hubAvailable;
    
    if (this.mockMode) {
      console.log('[Demiurge] Running in mock mode');
    }
  }

  /**
   * Initialize - call this when your game starts
   */
  async initialize() {
    try {
      const response = await fetch('assets/data/nft_assets.json');
      this.assetConfig = await response.json();
      console.log('[Demiurge] Loaded', this.assetConfig.nftUnlocks?.length || 0, 'unlockables');
    } catch (error) {
      console.warn('[Demiurge] No asset config found, using defaults');
      this.assetConfig = { assetClasses: {}, nftUnlocks: [], mintableAchievements: [] };
    }

    if (this.hubAvailable) {
      await this.connect();
    }

    return this;
  }

  /**
   * Connect to user's wallet
   */
  async connect() {
    if (this.mockMode) {
      this.isConnected = true;
      this.userAddress = 'mock_' + Math.random().toString(36).substr(2, 8);
      this.qorId = 'MockUser#0001';
      this.userNFT = this._createMockNFT();
      await this._processNFTUnlocks();
      this.onConnectionChange(true);
      return true;
    }

    try {
      this.qorId = await window.DemiurgeHUD.getQORID();
      this.userAddress = await window.DemiurgeHUD.getWalletAddress();
      this.userNFT = await window.DemiurgeHUD.getUserAchievementNFT();
      this.isConnected = true;
      await this._processNFTUnlocks();
      this.onConnectionChange(true);
      return true;
    } catch (error) {
      console.error('[Demiurge] Connection failed:', error);
      this.isConnected = false;
      this.onConnectionChange(false);
      return false;
    }
  }

  /**
   * Get the asset path for a given class (returns unlocked or default)
   * @param {string} assetClass - e.g., 'player_skin', 'trail_effect'
   */
  getAsset(assetClass) {
    if (this.unlockedAssets[assetClass]) {
      return this.unlockedAssets[assetClass];
    }
    return this.assetConfig?.assetClasses?.[assetClass]?.default || null;
  }

  /**
   * Check if a specific unlock is active
   */
  hasUnlock(unlockId) {
    return this.unlockedAssets._unlockIds?.includes(unlockId) || false;
  }

  /**
   * Get NFT dynamic state value
   * @param {string} path - e.g., 'stats/xp', 'games/other-game/score'
   */
  async getNFTState(path) {
    if (this.mockMode) {
      return this.userNFT?.dynamicState?.[path] || null;
    }
    if (!this.userNFT?.tokenId) return null;
    try {
      return await window.DemiurgeHUD.getNFTState(this.userNFT.tokenId, path);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get multiple state values at once
   */
  async getNFTStateBatch(paths) {
    if (this.mockMode) {
      return paths.map(path => ({ path, value: this.userNFT?.dynamicState?.[path] || null }));
    }
    if (!this.userNFT?.tokenId) {
      return paths.map(path => ({ path, value: null }));
    }
    try {
      return await window.DemiurgeHUD.getNFTStateBatch(this.userNFT.tokenId, paths);
    } catch (error) {
      return paths.map(path => ({ path, value: null }));
    }
  }

  /**
   * Award an achievement - mints soulbound NFT
   * @param {string} achievementId - ID from nft_assets.json
   * @param {object} context - e.g., { score: 50000 }
   */
  async awardAchievement(achievementId, context = {}) {
    const achievement = this.assetConfig?.mintableAchievements?.find(a => a.id === achievementId);
    if (!achievement) {
      return { success: false, error: 'Unknown achievement' };
    }

    // Check if already awarded
    const existing = await this.getNFTState(`achievements/${achievementId}`);
    if (existing) {
      return { success: false, error: 'Already awarded', alreadyAwarded: true };
    }

    if (this.mockMode) {
      const timestamp = Math.floor(Date.now() / 1000);
      this.userNFT.dynamicState[`achievements/${achievementId}`] = timestamp.toString();
      
      // Process state updates
      for (const [key, value] of Object.entries(achievement.dynamicStateUpdates || {})) {
        let processedValue = value
          .replace('{timestamp}', timestamp.toString())
          .replace('{score}', context.score?.toString() || '0')
          .replace('{gameId}', this.gameId);
        
        const processedKey = key.replace('{gameId}', this.gameId);
        
        if (processedValue.startsWith('+')) {
          const current = parseInt(this.userNFT.dynamicState[processedKey] || '0');
          processedValue = (current + parseInt(processedValue)).toString();
        }
        this.userNFT.dynamicState[processedKey] = processedValue;
      }

      this.onAchievementMinted(achievement);
      await this._processNFTUnlocks();
      
      return { success: true, mock: true, achievement };
    }

    try {
      const result = await window.DemiurgeHUD.mintAchievement({
        achievementId,
        gameId: this.gameId,
        name: achievement.name,
        description: achievement.description,
        soulbound: achievement.soulbound !== false,
        metadata: achievement.metadata,
        dynamicStateUpdates: this._processStateUpdates(achievement.dynamicStateUpdates, context),
      });

      if (result.success) {
        this.onAchievementMinted(achievement);
        await this._processNFTUnlocks();
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update game-specific state
   */
  async updateGameState(key, value) {
    const path = `games/${this.gameId}/${key}`;
    
    if (this.mockMode) {
      this.userNFT.dynamicState[path] = value.toString();
      return { success: true };
    }

    try {
      return await window.DemiurgeHUD.setNFTState(this.userNFT.tokenId, path, value.toString());
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment a stat
   */
  async incrementStat(path, amount = 1) {
    const current = parseInt(await this.getNFTState(path) || '0');
    const newValue = current + amount;
    
    if (this.mockMode) {
      this.userNFT.dynamicState[path] = newValue.toString();
      return { success: true, newValue };
    }

    try {
      await window.DemiurgeHUD.setNFTState(this.userNFT.tokenId, path, newValue.toString());
      return { success: true, newValue };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get state from another game (interoperability)
   */
  async getOtherGameState(gameId, key) {
    return this.getNFTState(`games/${gameId}/${key}`);
  }

  /**
   * Get global player stat
   */
  async getGlobalStat(statName) {
    return this.getNFTState(`stats/${statName}`);
  }

  /**
   * Add XP to player
   */
  async addXP(amount) {
    return this.incrementStat('stats/xp', amount);
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERNAL METHODS
  // ═══════════════════════════════════════════════════════════════

  async _processNFTUnlocks() {
    if (!this.assetConfig?.nftUnlocks) return;

    this.unlockedAssets = { _unlockIds: [] };

    for (const unlock of this.assetConfig.nftUnlocks) {
      if (await this._checkCondition(unlock.conditions)) {
        this.unlockedAssets._unlockIds.push(unlock.id);
        for (const [key, value] of Object.entries(unlock.unlocks)) {
          this.unlockedAssets[key] = value;
        }
      }
    }

    this.onAssetsLoaded(this.unlockedAssets);
  }

  async _checkCondition(condition) {
    if (!this.userNFT || !condition) return false;

    if (condition.type === 'ownership' && condition.check === 'hasAchievement') {
      const value = await this.getNFTState(condition.achievementKey);
      return value !== null && value !== '';
    }

    if (condition.type === 'dynamicState') {
      const value = await this.getNFTState(condition.path);
      if (value === null) return false;

      if (condition.check === 'valueGreaterThan') {
        return parseFloat(value) > condition.threshold;
      }
      if (condition.check === 'valueEquals') {
        return value === condition.value;
      }
      if (condition.check === 'exists') {
        return true;
      }
    }

    return false;
  }

  _createMockNFT() {
    return {
      tokenId: 'mock-nft-' + Date.now(),
      owner: this.userAddress,
      isSoulbound: true,
      dynamicState: {
        'stats/xp': '500',
        'stats/level': '2',
        'stats/games_played': '3',
      }
    };
  }

  _processStateUpdates(updates, context) {
    if (!updates) return {};
    const processed = {};
    const timestamp = Math.floor(Date.now() / 1000);
    
    for (const [key, value] of Object.entries(updates)) {
      processed[key.replace('{gameId}', this.gameId)] = value
        .replace('{timestamp}', timestamp.toString())
        .replace('{score}', context.score?.toString() || '0');
    }
    return processed;
  }

  disconnect() {
    this.isConnected = false;
    this.userAddress = null;
    this.qorId = null;
    this.userNFT = null;
    this.unlockedAssets = {};
    this.onConnectionChange(false);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemiurgeIntegration;
}
if (typeof window !== 'undefined') {
  window.DemiurgeIntegration = DemiurgeIntegration;
}
