/**
 * Demiurge Game HUD Injection Script
 * 
 * This script can be included in games to enable blockchain integration
 * It provides a simple API for games to interact with the Demiurge blockchain
 */

(function() {
  'use strict';

  // Check if already injected
  if (window.__DEMIURGE_HUD_INJECTED__) {
    return;
  }
  window.__DEMIURGE_HUD_INJECTED__ = true;

  /**
   * Game HUD API
   */
  window.DemiurgeHUD = {
    /**
     * Initialize the HUD with user address
     * @param {Object} config - Configuration object
     * @param {string} config.address - User's blockchain address
     * @param {string} [config.position='top-right'] - HUD position
     * @param {boolean} [config.compact=false] - Use compact mode
     */
    init: function(config) {
      if (!config || !config.address) {
        console.error('DemiurgeHUD.init: address is required');
        return;
      }

      // Dispatch event for React component
      window.dispatchEvent(new CustomEvent('demiurge-hud-init', {
        detail: {
          address: config.address,
          position: config.position || 'top-right',
          compact: config.compact || false,
          onSpend: config.onSpend,
          onEarn: config.onEarn,
          onAssets: config.onAssets,
        }
      }));
    },

    /**
     * Update HUD data
     * @param {Object} data - Data to update
     */
    update: function(data) {
      window.dispatchEvent(new CustomEvent('demiurge-hud-update', {
        detail: data
      }));
    },

    /**
     * Show transaction status
     * @param {string} hash - Transaction hash
     * @param {string} status - Transaction status
     */
    showTransaction: function(hash, status) {
      window.dispatchEvent(new CustomEvent('demiurge-hud-tx', {
        detail: { hash, status }
      }));
    },

    /**
     * Hide the HUD
     */
    hide: function() {
      window.dispatchEvent(new CustomEvent('demiurge-hud-hide'));
    },

    /**
     * Show the HUD
     */
    show: function() {
      window.dispatchEvent(new CustomEvent('demiurge-hud-show'));
    }
  };

  console.log('Demiurge Game HUD API initialized');
})();
