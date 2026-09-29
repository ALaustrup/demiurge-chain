/**
 * Audio Capture Manager
 * 
 * Handles microphone access, real-time PCM encoding, and base64 conversion
 * for streaming to the Grok Voice Agent API.
 */

import type { SampleRate } from './types';

export interface AudioCaptureConfig {
  sampleRate: SampleRate;
  channelCount: 1; // Mono only
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export type AudioCaptureState = 'idle' | 'requesting' | 'recording' | 'paused' | 'error';

export interface AudioCaptureEvents {
  onStateChange?: (state: AudioCaptureState) => void;
  onAudioData?: (base64Audio: string) => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

const DEFAULT_CONFIG: AudioCaptureConfig = {
  sampleRate: 24000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * AudioCaptureManager handles microphone input and converts it to
 * base64-encoded PCM16 audio suitable for the Grok Voice API.
 */
export class AudioCaptureManager {
  private config: AudioCaptureConfig;
  private events: AudioCaptureEvents;
  private state: AudioCaptureState = 'idle';
  
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  
  private audioLevelInterval: number | null = null;
  
  constructor(config: Partial<AudioCaptureConfig> = {}, events: AudioCaptureEvents = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events;
  }

  /**
   * Request microphone permissions and check availability
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[AudioCapture] Permission denied:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is granted
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch {
      // Fallback for browsers that don't support permissions API
      return 'prompt';
    }
  }

  /**
   * Get available audio input devices
   */
  async getInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  /**
   * Start capturing audio from the microphone
   */
  async start(deviceId?: string): Promise<void> {
    if (this.state === 'recording') {
      console.warn('[AudioCapture] Already recording');
      return;
    }

    this.setState('requesting');

    try {
      // Get microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
      });

      // Create audio context with target sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create analyser for audio level monitoring
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.sourceNode.connect(this.analyserNode);

      // Create script processor for PCM capture
      // Note: ScriptProcessorNode is deprecated but AudioWorklet requires more setup
      // For production, consider migrating to AudioWorklet
      await this.setupAudioProcessor();

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      this.setState('recording');
    } catch (error) {
      this.setState('error');
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Set up the audio processor for PCM capture
   */
  private async setupAudioProcessor(): Promise<void> {
    if (!this.audioContext || !this.sourceNode) return;

    // Use ScriptProcessorNode for broader compatibility
    // Buffer size of 4096 at 24kHz gives ~170ms chunks
    const bufferSize = 4096;
    const scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    scriptProcessor.onaudioprocess = (event) => {
      if (this.state !== 'recording') return;

      const inputData = event.inputBuffer.getChannelData(0);
      const base64Audio = this.floatToPCM16Base64(inputData);
      this.events.onAudioData?.(base64Audio);
    };

    this.sourceNode.connect(scriptProcessor);
    scriptProcessor.connect(this.audioContext.destination);
  }

  /**
   * Convert Float32Array audio data to base64-encoded PCM16
   */
  private floatToPCM16Base64(float32Array: Float32Array): string {
    // Convert float32 [-1, 1] to int16 [-32768, 32767]
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Convert to base64
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Start monitoring audio levels for visualization
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    
    const checkLevel = () => {
      if (this.state !== 'recording' || !this.analyserNode) {
        return;
      }

      this.analyserNode.getByteFrequencyData(dataArray);
      
      // Calculate average level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = average / 255; // 0-1 range

      this.events.onAudioLevel?.(normalizedLevel);
    };

    // Check level 30 times per second
    this.audioLevelInterval = window.setInterval(checkLevel, 33);
  }

  /**
   * Pause audio capture
   */
  pause(): void {
    if (this.state === 'recording') {
      this.setState('paused');
    }
  }

  /**
   * Resume audio capture
   */
  resume(): void {
    if (this.state === 'paused') {
      this.setState('recording');
    }
  }

  /**
   * Stop audio capture and release resources
   */
  stop(): void {
    // Stop audio level monitoring
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear nodes
    this.sourceNode = null;
    this.workletNode = null;
    this.analyserNode = null;

    this.setState('idle');
  }

  /**
   * Update state and notify listeners
   */
  private setState(state: AudioCaptureState): void {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  /**
   * Get current state
   */
  getState(): AudioCaptureState {
    return this.state;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.state === 'recording';
  }

  /**
   * Update event handlers
   */
  setEvents(events: Partial<AudioCaptureEvents>): void {
    this.events = { ...this.events, ...events };
  }
}

/**
 * Create a singleton instance for easy use
 */
let captureInstance: AudioCaptureManager | null = null;

export function getAudioCapture(
  config?: Partial<AudioCaptureConfig>,
  events?: AudioCaptureEvents
): AudioCaptureManager {
  if (!captureInstance) {
    captureInstance = new AudioCaptureManager(config, events);
  } else if (events) {
    captureInstance.setEvents(events);
  }
  return captureInstance;
}

export function resetAudioCapture(): void {
  if (captureInstance) {
    captureInstance.stop();
    captureInstance = null;
  }
}
