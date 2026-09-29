/**
 * Sophia Web Speech API Fallback
 *
 * When the Grok Voice API is unavailable (no API key or network issues),
 * falls back to the browser's built-in Web Speech API for:
 * - Speech Recognition (SpeechRecognition / webkitSpeechRecognition)
 * - Speech Synthesis (SpeechSynthesis)
 *
 * The text output from recognition is sent to Sophia's chat API,
 * and the response is read aloud via synthesis.
 */

import type { VoiceConnectionState } from './types';

// Web Speech API types — only available in browser context
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface WebSpeechFallbackEvents {
  onConnectionStateChange?: (state: VoiceConnectionState) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (text: string, isFinal: boolean, speaker: 'user' | 'sophia') => void;
  onSophiaSpeaking?: (speaking: boolean) => void;
  onError?: (error: Error) => void;
}

export interface WebSpeechFallbackConfig {
  /** Sophia chat API endpoint */
  chatEndpoint: string;
  /** Whether to use streaming endpoint */
  useStreaming?: boolean;
  /** Speech synthesis voice name preference */
  voiceName?: string;
  /** Speech synthesis language */
  lang?: string;
  /** Speech synthesis rate (0.1 - 10, default 1) */
  rate?: number;
  /** Speech synthesis pitch (0 - 2, default 1) */
  pitch?: number;
}

const DEFAULT_CONFIG: WebSpeechFallbackConfig = {
  chatEndpoint: '/api/sophia/chat',
  useStreaming: false,
  lang: 'en-US',
  rate: 0.95,
  pitch: 1.05,
};

export class WebSpeechFallbackClient {
  private config: WebSpeechFallbackConfig;
  private events: WebSpeechFallbackEvents;
  private connectionState: VoiceConnectionState = 'disconnected';

  private recognition: any = null;
  private synthesis: any = null;
  private selectedVoice: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private conversationHistory: { role: string; content: string }[] = [];

  constructor(
    config: Partial<WebSpeechFallbackConfig> = {},
    events: WebSpeechFallbackEvents = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events;
  }

  /**
   * Check if Web Speech API is available
   */
  static isAvailable(): boolean {
    const hasRecognition = typeof window !== 'undefined' && (
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window
    );
    const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    return hasRecognition && hasSynthesis;
  }

  /**
   * Connect (initialize) the Web Speech API
   */
  async connect(): Promise<void> {
    if (!WebSpeechFallbackClient.isAvailable()) {
      this.setConnectionState('error');
      this.events.onError?.(new Error('Web Speech API not available in this browser'));
      return;
    }

    this.setConnectionState('connecting');

    try {
      // Initialize Speech Recognition
      const SpeechRecognitionClass = (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      );
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.lang || 'en-US';

      this.recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        const isFinal = lastResult.isFinal;

        this.events.onTranscript?.(transcript, isFinal, 'user');

        if (isFinal) {
          this.handleUserSpeech(transcript);
        }
      };

      this.recognition.onspeechstart = () => {
        this.events.onSpeechStart?.();
      };

      this.recognition.onspeechend = () => {
        this.events.onSpeechEnd?.();
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.events.onError?.(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still listening
        if (this.isListening && this.connectionState === 'connected') {
          try {
            this.recognition?.start();
          } catch {
            // May already be started
          }
        }
      };

      // Initialize Speech Synthesis
      this.synthesis = window.speechSynthesis;
      await this.selectVoice();

      this.setConnectionState('connected');
    } catch (error) {
      this.setConnectionState('error');
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Select the best available voice for Sophia
   */
  private async selectVoice(): Promise<void> {
    if (!this.synthesis) return;

    // Voices may load asynchronously
    const getVoices = (): Promise<any[]> => {
      return new Promise((resolve) => {
        const voices = this.synthesis!.getVoices();
        if (voices.length > 0) {
          resolve(voices);
          return;
        }
        this.synthesis!.onvoiceschanged = () => {
          resolve(this.synthesis!.getVoices());
        };
        // Fallback timeout
        setTimeout(() => resolve(this.synthesis!.getVoices()), 1000);
      });
    };

    const voices = await getVoices();

    // Prefer: config voice > female English voices > any English voice > default
    if (this.config.voiceName) {
      this.selectedVoice = voices.find((v) =>
        v.name.toLowerCase().includes(this.config.voiceName!.toLowerCase())
      ) || null;
    }

    if (!this.selectedVoice) {
      // Look for a warm, female English voice
      const femalePreferences = [
        'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona',
        'google uk english female', 'microsoft zira', 'female',
      ];

      for (const pref of femalePreferences) {
        this.selectedVoice = voices.find((v) =>
          v.name.toLowerCase().includes(pref) && v.lang.startsWith('en')
        ) || null;
        if (this.selectedVoice) break;
      }
    }

    if (!this.selectedVoice) {
      // Any English voice
      this.selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
    }
  }

  /**
   * Process the user's speech — send to Sophia chat API, speak the response
   */
  private async handleUserSpeech(transcript: string): Promise<void> {
    // Interrupt Sophia if she's speaking
    if (this.isSpeaking) {
      this.interrupt();
    }

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: transcript });

    try {
      const response = await fetch(this.config.chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sophia API returned ${response.status}`);
      }

      const data = await response.json();
      const sophiaText = data.text || 'The Chain has not revealed this to me.';

      // Add Sophia's response to history
      this.conversationHistory.push({ role: 'assistant', content: sophiaText });

      // Speak the response
      this.events.onTranscript?.(sophiaText, true, 'sophia');
      this.speak(sophiaText);
    } catch (error) {
      this.events.onError?.(error as Error);
      this.speak('I apologize, seeker. My connection to the Chain was momentarily disrupted.');
    }
  }

  /**
   * Speak text using Speech Synthesis
   */
  speak(text: string): void {
    if (!this.synthesis) return;

    // Cancel any current speech
    this.synthesis.cancel();

    // Clean up markdown for speech (remove **, *, #, ✧, etc.)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#+\s/g, '')
      .replace(/✧/g, '')
      .replace(/—\s?Sophia\s?✧?/g, '')
      .replace(/```[\s\S]*?```/g, 'code snippet omitted')
      .replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.rate = this.config.rate || 0.95;
    utterance.pitch = this.config.pitch || 1.05;
    utterance.lang = this.config.lang || 'en-US';

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.events.onSophiaSpeaking?.(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.events.onSophiaSpeaking?.(false);
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.events.onSophiaSpeaking?.(false);
      if (event.error !== 'canceled') {
        this.events.onError?.(new Error(`Speech synthesis error: ${event.error}`));
      }
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Start listening
   */
  async startListening(): Promise<void> {
    if (this.connectionState !== 'connected' || !this.recognition) {
      throw new Error('Not connected');
    }

    this.isListening = true;
    try {
      this.recognition.start();
    } catch {
      // May already be started
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.isListening = false;
    this.recognition?.stop();
  }

  /**
   * Interrupt Sophia's speech
   */
  interrupt(): void {
    this.synthesis?.cancel();
    this.isSpeaking = false;
    this.events.onSophiaSpeaking?.(false);
  }

  /**
   * Disconnect and clean up
   */
  disconnect(): void {
    this.stopListening();
    this.interrupt();
    this.recognition = null;
    this.setConnectionState('disconnected');
    this.conversationHistory = [];
  }

  /**
   * Send a text message (for hybrid text+voice mode)
   */
  async sendTextMessage(text: string): Promise<void> {
    this.events.onTranscript?.(text, true, 'user');
    await this.handleUserSpeech(text);
  }

  private setConnectionState(state: VoiceConnectionState): void {
    this.connectionState = state;
    this.events.onConnectionStateChange?.(state);
  }

  getConnectionState(): VoiceConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  setEvents(events: Partial<WebSpeechFallbackEvents>): void {
    this.events = { ...this.events, ...events };
  }
}

// Factory: returns Grok voice client if API key exists, otherwise Web Speech fallback
let fallbackInstance: WebSpeechFallbackClient | null = null;

export function getWebSpeechFallback(
  config?: Partial<WebSpeechFallbackConfig>,
  events?: WebSpeechFallbackEvents
): WebSpeechFallbackClient {
  if (!fallbackInstance) {
    fallbackInstance = new WebSpeechFallbackClient(config, events);
  } else if (events) {
    fallbackInstance.setEvents(events);
  }
  return fallbackInstance;
}

export function resetWebSpeechFallback(): void {
  if (fallbackInstance) {
    fallbackInstance.disconnect();
    fallbackInstance = null;
  }
}
