/**
 * Blockchain Bridge
 * 
 * Handles RPC and WebSocket connections to the Demiurge blockchain.
 */

import { EventEmitter } from 'eventemitter3';
import type { GameEvent } from '../types';

interface BridgeEvents {
  'connected': () => void;
  'disconnected': () => void;
  'event': (event: GameEvent) => void;
  'error': (error: Error) => void;
}

/**
 * Bridge to Demiurge blockchain
 */
export class BlockchainBridge extends EventEmitter<BridgeEvents> {
  private rpcUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests: Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(rpcUrl: string, wsUrl: string) {
    super();
    this.rpcUrl = rpcUrl;
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<void> {
    // Test RPC connection
    await this.call('chain_getHealth');
    
    // Establish WebSocket for real-time events
    await this.connectWebSocket();
    
    this.emit('connected');
  }

  /**
   * Connect WebSocket for real-time events
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          console.log('[BlockchainBridge] WebSocket connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle subscription events
            if (data.method === 'gameEngine_event') {
              this.emit('event', data.params as GameEvent);
            }
            
            // Handle RPC responses (for WebSocket RPC)
            if (data.id && this.pendingRequests.has(data.id)) {
              const { resolve, reject } = this.pendingRequests.get(data.id)!;
              this.pendingRequests.delete(data.id);
              
              if (data.error) {
                reject(new Error(data.error.message || 'RPC Error'));
              } else {
                resolve(data.result);
              }
            }
          } catch (e) {
            console.error('[BlockchainBridge] Failed to parse WebSocket message:', e);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('[BlockchainBridge] WebSocket error:', error);
          this.emit('error', new Error('WebSocket connection error'));
        };
        
        this.ws.onclose = () => {
          console.log('[BlockchainBridge] WebSocket disconnected');
          this.emit('disconnected');
          
          // Attempt reconnection after 5 seconds
          setTimeout(() => {
            if (this.ws?.readyState === WebSocket.CLOSED) {
              this.connectWebSocket().catch(console.error);
            }
          }, 5000);
        };
      } catch (e) {
        // WebSocket not available (e.g., SSR)
        resolve();
      }
    });
  }

  /**
   * Make an RPC call to the blockchain
   */
  async call<T = unknown>(method: string, params?: unknown): Promise<T> {
    const id = ++this.requestId;
    
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params: params ? [params] : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC Error');
    }

    return data.result as T;
  }

  /**
   * Subscribe to blockchain events via WebSocket
   */
  subscribe(eventType: string, callback: (event: GameEvent) => void): () => void {
    // Send subscription request
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'gameEngine_subscribe',
        params: [eventType],
      }));
    }

    // Set up listener
    const handler = (event: GameEvent) => {
      if (event.type === eventType) {
        callback(event);
      }
    };
    
    this.on('event', handler);
    
    // Return unsubscribe function
    return () => {
      this.off('event', handler);
    };
  }

  /**
   * Get balance for a QOR ID
   */
  async getBalance(qorId: string): Promise<string> {
    const address = await this.getAddress(qorId);
    return this.call<string>('balances_getBalance', address);
  }

  /**
   * Get on-chain address for a QOR ID
   */
  async getAddress(qorId: string): Promise<string> {
    // Simple deterministic address derivation from QOR ID
    // In production, this would use proper key derivation
    const encoder = new TextEncoder();
    const data = encoder.encode(qorId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit('disconnected');
  }
}
