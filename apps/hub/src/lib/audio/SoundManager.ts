/**
 * Sound Manager
 * 
 * Manages all audio for the immersive world.
 * Uses Howler.js for cross-browser audio support.
 */

import { Howl, Howler } from 'howler';

// ============================================================================
// Types
// ============================================================================

type SoundId = 
  | 'ambient'
  | 'hover'
  | 'click'
  | 'success'
  | 'error'
  | 'transition'
  | 'notification'
  | 'block'
  | 'transaction';

interface SoundConfig {
  src: string[];
  volume: number;
  loop?: boolean;
  spatial?: boolean;
}

// ============================================================================
// Sound Definitions
// ============================================================================

const SOUNDS: Record<SoundId, SoundConfig> = {
  // Ambient background
  ambient: {
    src: ['/audio/ambient-hum.mp3', '/audio/ambient-hum.ogg'],
    volume: 0.15,
    loop: true,
  },
  
  // UI interactions
  hover: {
    src: ['/audio/hover.mp3', '/audio/hover.ogg'],
    volume: 0.1,
  },
  click: {
    src: ['/audio/click.mp3', '/audio/click.ogg'],
    volume: 0.2,
  },
  
  // Feedback
  success: {
    src: ['/audio/success.mp3', '/audio/success.ogg'],
    volume: 0.25,
  },
  error: {
    src: ['/audio/error.mp3', '/audio/error.ogg'],
    volume: 0.2,
  },
  
  // Navigation
  transition: {
    src: ['/audio/transition.mp3', '/audio/transition.ogg'],
    volume: 0.2,
  },
  
  // Notifications
  notification: {
    src: ['/audio/notification.mp3', '/audio/notification.ogg'],
    volume: 0.3,
  },
  
  // Blockchain events
  block: {
    src: ['/audio/block.mp3', '/audio/block.ogg'],
    volume: 0.15,
  },
  transaction: {
    src: ['/audio/transaction.mp3', '/audio/transaction.ogg'],
    volume: 0.1,
  },
};

// ============================================================================
// Sound Manager Class
// ============================================================================

class SoundManager {
  private sounds: Map<SoundId, Howl> = new Map();
  private enabled: boolean = true;
  private masterVolume: number = 0.5;
  private initialized: boolean = false;
  
  /**
   * Initialize all sounds
   */
  async init() {
    if (this.initialized) return;
    
    // Check if audio files exist before loading
    // For now, create placeholder sounds that won't error
    for (const [id, config] of Object.entries(SOUNDS)) {
      try {
        const howl = new Howl({
          src: config.src,
          volume: config.volume * this.masterVolume,
          loop: config.loop || false,
          preload: true,
          onloaderror: () => {
            // Silently fail - audio is optional
            console.log(`[Audio] Sound not found: ${id}`);
          },
        });
        
        this.sounds.set(id as SoundId, howl);
      } catch (e) {
        // Ignore loading errors
      }
    }
    
    this.initialized = true;
  }
  
  /**
   * Play a sound
   */
  play(id: SoundId, options?: { volume?: number; rate?: number }) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(id);
    if (!sound) return;
    
    // Apply options
    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.masterVolume);
    }
    if (options?.rate !== undefined) {
      sound.rate(options.rate);
    }
    
    sound.play();
  }
  
  /**
   * Stop a sound
   */
  stop(id: SoundId) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
  }
  
  /**
   * Stop all sounds
   */
  stopAll() {
    this.sounds.forEach(sound => sound.stop());
  }
  
  /**
   * Start ambient sound
   */
  startAmbient() {
    if (!this.enabled) return;
    
    const ambient = this.sounds.get('ambient');
    if (ambient && !ambient.playing()) {
      ambient.play();
    }
  }
  
  /**
   * Stop ambient sound
   */
  stopAmbient() {
    this.stop('ambient');
  }
  
  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }
  
  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }
  
  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    
    if (!enabled) {
      this.stopAll();
    }
  }
  
  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Play UI hover sound
   */
  playHover() {
    this.play('hover', { volume: 0.05 });
  }
  
  /**
   * Play UI click sound
   */
  playClick() {
    this.play('click');
  }
  
  /**
   * Play success feedback
   */
  playSuccess() {
    this.play('success');
  }
  
  /**
   * Play error feedback
   */
  playError() {
    this.play('error');
  }
  
  /**
   * Play zone transition sound
   */
  playTransition() {
    this.play('transition');
  }
  
  /**
   * Play notification sound
   */
  playNotification() {
    this.play('notification');
  }
  
  /**
   * Play block production sound
   */
  playBlock() {
    this.play('block', { volume: 0.1 });
  }
  
  /**
   * Play transaction sound
   */
  playTransaction() {
    this.play('transaction', { volume: 0.05 });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const soundManager = new SoundManager();

export default soundManager;
