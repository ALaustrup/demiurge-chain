/**
 * Demiurge HUD Injection Script
 * 
 * This script is automatically injected into Rosebud.AI games
 * to enable communication with the Demiurge Hub.
 * 
 * Usage in Rosebud.AI games:
 * - Check window.parent.QOR_ID for user identity
 * - Use window.parent.postMessage() to communicate with hub
 * - Access window.DemiurgeHUD for convenience methods
 */

(function() {
  'use strict';
  
  // Check if we're in an iframe
  if (window.self === window.top) {
    console.warn('DemiurgeHUD: Not running in iframe, HUD features disabled');
    return;
  }
  
  /**
   * Demiurge HUD API
   */
  window.DemiurgeHUD = {
    /**
     * Get current CGT balance
     * @returns {Promise<number>} Balance in CGT
     */
    getCGTBalance: function() {
      return new Promise((resolve, reject) => {
        const messageId = `balance_${Date.now()}_${Math.random()}`;
        
        const handler = (event) => {
          if (event.data.type === 'CGT_BALANCE_RESPONSE' && event.data.messageId === messageId) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.balance);
            }
          }
        };
        
        window.addEventListener('message', handler);
        window.parent.postMessage({
          type: 'GET_BALANCE',
          messageId: messageId,
        }, '*');
        
        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for balance response'));
        }, 5000);
      });
    },
    
    /**
     * Spend CGT
     * @param {number} amount - Amount to spend
     * @param {string} reason - Reason for spending
     * @returns {Promise<string>} Transaction hash
     */
    spendCGT: function(amount, reason) {
      return new Promise((resolve, reject) => {
        const messageId = `spend_${Date.now()}_${Math.random()}`;
        
        const handler = (event) => {
          if (event.data.type === 'CGT_SPEND_RESPONSE' && event.data.messageId === messageId) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.txHash);
            }
          }
        };
        
        window.addEventListener('message', handler);
        window.parent.postMessage({
          type: 'SPEND_CGT',
          messageId: messageId,
          amount: amount,
          reason: reason,
        }, '*');
        
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for spend response'));
        }, 10000);
      });
    },
    
    /**
     * Update user XP
     * @param {number} xp - XP to add
     * @param {string} source - Source of XP (e.g., 'game_win', 'tutorial')
     */
    updateAccountXP: function(xp, source) {
      window.parent.postMessage({
        type: 'UPDATE_XP',
        value: xp,
        source: source || 'game',
      }, '*');
    },
    
    /**
     * Open social platform
     */
    openSocial: function() {
      window.parent.postMessage({
        type: 'OPEN_SOCIAL',
      }, '*');
    },
    
    /**
     * Get user assets (DRC-369 NFTs)
     * @returns {Promise<Array>} Array of asset UUIDs
     */
    getUserAssets: function() {
      return new Promise((resolve, reject) => {
        const messageId = `assets_${Date.now()}_${Math.random()}`;
        
        const handler = (event) => {
          if (event.data.type === 'USER_ASSETS_RESPONSE' && event.data.messageId === messageId) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.assets || []);
            }
          }
        };
        
        window.addEventListener('message', handler);
        window.parent.postMessage({
          type: 'GET_USER_ASSETS',
          messageId: messageId,
        }, '*');
        
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for assets response'));
        }, 5000);
      });
    },
    
    /**
     * Check if user owns a specific asset
     * @param {string} assetUuid - Asset UUID to check
     * @returns {Promise<boolean>} True if user owns the asset
     */
    ownsAsset: function(assetUuid) {
      return this.getUserAssets().then(assets => {
        return assets.some(asset => asset.uuid === assetUuid);
      });
    },
    
    /**
     * Get QOR ID
     * @returns {Promise<string>} User's QOR ID
     */
    getQORID: function() {
      return new Promise((resolve, reject) => {
        const messageId = `qorid_${Date.now()}_${Math.random()}`;
        
        const handler = (event) => {
          if (event.data.type === 'QOR_ID_RESPONSE' && event.data.messageId === messageId) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.qorId);
            }
          }
        };
        
        window.addEventListener('message', handler);
        window.parent.postMessage({
          type: 'GET_QOR_ID',
          messageId: messageId,
        }, '*');
        
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for QOR ID response'));
        }, 5000);
      });
    },
  };
  
  /**
   * Expose QOR_ID object for Rosebud.AI compatibility
   */
  window.QOR_ID = {
    get: function() {
      return window.DemiurgeHUD.getQORID();
    },
  };
  
  /**
   * Expose userAssets for asset checking
   */
  window.userAssets = {
    get: function() {
      return window.DemiurgeHUD.getUserAssets();
    },
    owns: function(uuid) {
      return window.DemiurgeHUD.ownsAsset(uuid);
    },
  };
  
  console.log('DemiurgeHUD: Initialized successfully');
})();
