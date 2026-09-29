/**
 * Game Integration HUD API
 * 
 * Provides a simple API for games to integrate blockchain features
 */

export interface GameHUDConfig {
  address: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  onSpend?: () => void;
  onEarn?: () => void;
  onAssets?: () => void;
}

export interface GameHUDData {
  balance: string;
  energy: {
    current: number;
    max: number;
    percentage: number;
  };
}

/**
 * Initialize Game HUD
 * 
 * This function can be called from games to initialize the blockchain HUD
 */
export function initGameHUD(config: GameHUDConfig): void {
  // Store config in window for React component access
  if (typeof window !== 'undefined') {
    (window as any).__DEMIURGE_HUD_CONFIG__ = config;
    
    // Dispatch custom event to notify React component
    window.dispatchEvent(new CustomEvent('demiurge-hud-init', { detail: config }));
  }
}

/**
 * Update Game HUD data
 */
export function updateGameHUD(data: Partial<GameHUDData>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demiurge-hud-update', { detail: data }));
  }
}

/**
 * Show transaction status in HUD
 */
export function showTransactionStatus(hash: string, status: 'pending' | 'success' | 'failed'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demiurge-hud-tx', {
      detail: { hash, status }
    }));
  }
}

/**
 * Hide Game HUD
 */
export function hideGameHUD(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demiurge-hud-hide'));
  }
}

/**
 * Show Game HUD
 */
export function showGameHUD(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demiurge-hud-show'));
  }
}
