/**
 * Audio Playback Manager
 * 
 * Handles decoding and playing base64-encoded PCM16 audio from
 * the Grok Voice Agent API with seamless chunk buffering.
 */

import type { SampleRate } from './types';

export interface AudioPlaybackConfig {
  sampleRate: SampleRate;
  bufferSize: number; // Number of chunks to buffer before playing
  volume: number; // 0-1
}

export type AudioPlaybackState = 'idle' | 'buffering' | 'playing' | 'paused' | 'error';

export interface AudioPlaybackEvents {
  onStateChange?: (state: AudioPlaybackState) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: AudioPlaybackConfig = {
  sampleRate: 24000,
  bufferSize: 2, // Buffer 2 chunks before playing
  volume: 1.0,
};

/**
 * AudioPlaybackManager handles decoding and playing base64 PCM16 audio
 * with buffering for smooth playback.
 */
export class AudioPlaybackManager {
  private config: AudioPlaybackConfig;
  private events: AudioPlaybackEvents;
  private state: AudioPlaybackState = 'idle';
  
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  
  private audioQueue: AudioBuffer[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;

  constructor(config: Partial<AudioPlaybackConfig> = {}, events: AudioPlaybackEvents = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.config.volume;
    this.gainNode.connect(this.audioContext.destination);

    // Resume context if suspended (browser policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Add a base64-encoded PCM16 audio chunk to the playback queue
   */
  async addChunk(base64Audio: string): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      // Decode base64 to PCM16
      const audioBuffer = this.base64ToPCM16Buffer(base64Audio);
      this.audioQueue.push(audioBuffer);

      // Start playing if we have enough buffered
      if (this.state === 'idle' || this.state === 'buffering') {
        if (this.audioQueue.length >= this.config.bufferSize) {
          this.startPlayback();
        } else {
          this.setState('buffering');
        }
      }
    } catch (error) {
      console.error('[AudioPlayback] Error processing chunk:', error);
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Convert base64 PCM16 to AudioBuffer
   */
  private base64ToPCM16Buffer(base64Audio: string): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Decode base64 to bytes
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert to Int16Array (PCM16 little-endian)
    const int16Array = new Int16Array(bytes.buffer);

    // Convert to Float32Array for Web Audio API
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      // Normalize int16 [-32768, 32767] to float [-1, 1]
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // Create AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      float32Array.length,
      this.config.sampleRate
    );
    audioBuffer.copyToChannel(float32Array, 0);

    return audioBuffer;
  }

  /**
   * Start playback of queued audio
   */
  private startPlayback(): void {
    if (!this.audioContext || !this.gainNode) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.setState('playing');
    this.events.onPlaybackStart?.();

    // Set initial play time
    this.nextPlayTime = this.audioContext.currentTime;

    // Schedule all queued buffers
    this.scheduleBuffers();
  }

  /**
   * Schedule queued audio buffers for playback
   */
  private scheduleBuffers(): void {
    if (!this.audioContext || !this.gainNode) return;

    while (this.audioQueue.length > 0) {
      const buffer = this.audioQueue.shift()!;
      
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);

      // Schedule playback
      source.start(this.nextPlayTime);
      
      // Update next play time
      this.nextPlayTime += buffer.duration;

      // Track current source for stop functionality
      this.currentSource = source;

      // Handle playback end
      source.onended = () => {
        if (this.audioQueue.length === 0 && this.isPlaying) {
          // Check if we're actually done (no more scheduled audio)
          if (this.audioContext && this.audioContext.currentTime >= this.nextPlayTime - 0.1) {
            this.handlePlaybackEnd();
          }
        }
      };
    }
  }

  /**
   * Handle playback completion
   */
  private handlePlaybackEnd(): void {
    this.isPlaying = false;
    this.setState('idle');
    this.events.onPlaybackEnd?.();
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.audioContext && this.state === 'playing') {
      await this.audioContext.suspend();
      this.setState('paused');
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.state === 'paused') {
      await this.audioContext.resume();
      this.setState('playing');
    }
  }

  /**
   * Stop playback and clear queue
   */
  stop(): void {
    // Clear queue
    this.audioQueue = [];

    // Stop current source
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore - source may have already stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
    this.nextPlayTime = 0;
    this.setState('idle');
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * Mute audio
   */
  mute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
  }

  /**
   * Clear the audio queue without stopping current playback
   */
  clearQueue(): void {
    this.audioQueue = [];
  }

  /**
   * Get number of queued chunks
   */
  getQueueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Update state and notify listeners
   */
  private setState(state: AudioPlaybackState): void {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  /**
   * Get current state
   */
  getState(): AudioPlaybackState {
    return this.state;
  }

  /**
   * Check if currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Update event handlers
   */
  setEvents(events: Partial<AudioPlaybackEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
  }
}

/**
 * Create a singleton instance for easy use
 */
let playbackInstance: AudioPlaybackManager | null = null;

export function getAudioPlayback(
  config?: Partial<AudioPlaybackConfig>,
  events?: AudioPlaybackEvents
): AudioPlaybackManager {
  if (!playbackInstance) {
    playbackInstance = new AudioPlaybackManager(config, events);
  } else if (events) {
    playbackInstance.setEvents(events);
  }
  return playbackInstance;
}

export function resetAudioPlayback(): void {
  if (playbackInstance) {
    playbackInstance.dispose();
    playbackInstance = null;
  }
}
