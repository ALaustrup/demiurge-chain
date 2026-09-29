/**
 * WebRTC Client Manager
 * 
 * Handles peer-to-peer voice connections for user-to-user voice chat.
 * Uses the signaling API for connection negotiation.
 */

import type { WebRTCConnectionState, VoiceParticipant, SignalingMessage } from './types';

// STUN/TURN server configuration
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Add TURN servers here for NAT traversal if needed
  // { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }
];

export interface WebRTCClientConfig {
  roomId: string;
  userId: string;
  pollingInterval?: number;
}

export interface WebRTCClientEvents {
  onConnectionStateChange?: (peerId: string, state: WebRTCConnectionState) => void;
  onParticipantJoined?: (peerId: string) => void;
  onParticipantLeft?: (peerId: string) => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (peerId: string, level: number) => void;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  state: WebRTCConnectionState;
  audioElement: HTMLAudioElement | null;
}

export class WebRTCClient {
  private config: WebRTCClientConfig;
  private events: WebRTCClientEvents;
  
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private pollingInterval: number | null = null;
  private isConnected: boolean = false;
  private isMuted: boolean = false;

  constructor(config: WebRTCClientConfig, events: WebRTCClientEvents = {}) {
    this.config = {
      pollingInterval: 1000,
      ...config,
    };
    this.events = events;
  }

  /**
   * Join a voice room
   */
  async join(): Promise<void> {
    try {
      // Get local audio stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Join the room via signaling
      const response = await this.sendSignal('join');
      const { participants } = response;

      this.isConnected = true;

      // Start polling for signals
      this.startPolling();

      // Create offers to existing participants
      for (const peerId of participants) {
        await this.createOffer(peerId);
      }
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Leave the voice room
   */
  async leave(): Promise<void> {
    // Stop polling
    this.stopPolling();

    // Notify server
    try {
      await this.sendSignal('leave');
    } catch {
      // Ignore errors when leaving
    }

    // Close all peer connections
    for (const [peerId, peer] of this.peers) {
      this.closePeer(peerId);
    }
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.isConnected = false;
  }

  /**
   * Send a signal to the signaling server
   */
  private async sendSignal(
    action: string,
    targetUserId?: string,
    signalType?: string,
    payload?: any
  ): Promise<any> {
    const response = await fetch('/api/voice/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        roomId: this.config.roomId,
        userId: this.config.userId,
        targetUserId,
        signalType,
        payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Signaling error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a peer connection
   */
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const connection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('signal', peerId, 'ice-candidate', event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      const state = connection.connectionState as WebRTCConnectionState;
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.state = state;
      }
      this.events.onConnectionStateChange?.(peerId, state);

      if (state === 'failed' || state === 'disconnected') {
        this.handlePeerDisconnect(peerId);
      }
    };

    // Handle remote stream
    connection.ontrack = (event) => {
      const stream = event.streams[0];
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.stream = stream;
        
        // Create audio element for playback
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        peer.audioElement = audio;
        
        this.events.onRemoteStream?.(peerId, stream);
      }
    };

    // Store peer connection
    this.peers.set(peerId, {
      connection,
      stream: null,
      state: 'new',
      audioElement: null,
    });

    return connection;
  }

  /**
   * Create an offer to connect to a peer
   */
  private async createOffer(peerId: string): Promise<void> {
    const connection = this.createPeerConnection(peerId);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    await this.sendSignal('signal', peerId, 'offer', offer);
  }

  /**
   * Handle an incoming offer
   */
  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peer = this.peers.get(peerId);
    let connection: RTCPeerConnection;

    if (!peer) {
      connection = this.createPeerConnection(peerId);
      peer = this.peers.get(peerId)!;
    } else {
      connection = peer.connection;
    }

    await connection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    await this.sendSignal('signal', peerId, 'answer', answer);

    this.events.onParticipantJoined?.(peerId);
  }

  /**
   * Handle an incoming answer
   */
  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.warn(`[WebRTC] Received answer for unknown peer: ${peerId}`);
      return;
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    this.events.onParticipantJoined?.(peerId);
  }

  /**
   * Handle an incoming ICE candidate
   */
  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.warn(`[WebRTC] Received ICE candidate for unknown peer: ${peerId}`);
      return;
    }

    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Handle peer disconnect
   */
  private handlePeerDisconnect(peerId: string): void {
    this.closePeer(peerId);
    this.events.onParticipantLeft?.(peerId);
  }

  /**
   * Close a peer connection
   */
  private closePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      if (peer.audioElement) {
        peer.audioElement.pause();
        peer.audioElement.srcObject = null;
      }
      peer.connection.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Start polling for signals
   */
  private startPolling(): void {
    if (this.pollingInterval) return;

    const poll = async () => {
      if (!this.isConnected) return;

      try {
        const { signals, participants } = await this.sendSignal('poll');

        // Handle signals
        for (const signal of signals) {
          switch (signal.type) {
            case 'offer':
              await this.handleOffer(signal.from, signal.payload);
              break;
            case 'answer':
              await this.handleAnswer(signal.from, signal.payload);
              break;
            case 'ice-candidate':
              await this.handleIceCandidate(signal.from, signal.payload);
              break;
          }
        }

        // Check for new/left participants
        const currentPeers = new Set(this.peers.keys());
        const serverParticipants = new Set<string>(participants as string[]);

        // Handle new participants
        for (const peerId of serverParticipants) {
          if (!currentPeers.has(peerId)) {
            // New participant - they should send us an offer
            // (handled when we receive the offer signal)
          }
        }

        // Handle left participants
        for (const peerId of currentPeers) {
          if (!serverParticipants.has(peerId)) {
            this.handlePeerDisconnect(peerId);
          }
        }
      } catch (error) {
        console.error('[WebRTC] Polling error:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    this.pollingInterval = window.setInterval(poll, this.config.pollingInterval);
  }

  /**
   * Stop polling for signals
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Mute/unmute local audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Get mute state
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Get list of connected peers
   */
  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  /**
   * Get peer connection state
   */
  getPeerState(peerId: string): WebRTCConnectionState | null {
    const peer = this.peers.get(peerId);
    return peer?.state || null;
  }

  /**
   * Check if connected to room
   */
  isInRoom(): boolean {
    return this.isConnected;
  }

  /**
   * Update event handlers
   */
  setEvents(events: Partial<WebRTCClientEvents>): void {
    this.events = { ...this.events, ...events };
  }
}

// Factory function
export function createWebRTCClient(
  config: WebRTCClientConfig,
  events?: WebRTCClientEvents
): WebRTCClient {
  return new WebRTCClient(config, events);
}
