/**
 * WebSocket Subscription Service
 * Real-time data streaming via WebSocket
 */

import { blockchainService } from './blockchain';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionChannel =
  | 'balance'
  | 'transactions'
  | 'rewards'
  | 'gameState'
  | 'priceUpdate'
  | 'blockFinalized'
  | 'newBlock'
  | 'validatorStatus';

export interface SubscriptionOptions {
  onData: (data: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface SubscriptionListener {
  id: string;
  channel: SubscriptionChannel;
  context: Record<string, any>;
  options: SubscriptionOptions;
  active: boolean;
}

// ============================================================================
// WebSocket Service
// ============================================================================

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, SubscriptionListener> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1s, exponential backoff
  private messageQueue: Array<{ type: string; data: any }> = [];
  private listenerIdCounter = 0;

  constructor() {
    this.url = (process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || 'http://localhost:9944').replace(
      'http',
      'ws'
    );
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('✓ WebSocket connected');
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('✗ WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        this.socket.onclose = () => {
          console.log('✗ WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a data channel
   */
  subscribe(
    channel: SubscriptionChannel,
    context: Record<string, any>,
    options: SubscriptionOptions
  ): string {
    const listenerId = `listener_${++this.listenerIdCounter}`;

    const listener: SubscriptionListener = {
      id: listenerId,
      channel,
      context,
      options,
      active: true,
    };

    this.listeners.set(listenerId, listener);

    // Send subscription message to server
    this.sendMessage({
      type: 'subscribe',
      channel,
      context,
    });

    console.log(`✓ Subscribed to ${channel} (ID: ${listenerId})`);
    return listenerId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(listenerId: string): boolean {
    const listener = this.listeners.get(listenerId);

    if (!listener) {
      console.warn(`Listener ${listenerId} not found`);
      return false;
    }

    listener.active = false;
    this.listeners.delete(listenerId);

    // Send unsubscribe message to server
    this.sendMessage({
      type: 'unsubscribe',
      listenerId,
    });

    console.log(`✓ Unsubscribed from ${listener.channel}`);
    return true;
  }

  /**
   * Unsubscribe all listeners for a channel
   */
  unsubscribeAll(channel?: SubscriptionChannel): number {
    let count = 0;

    for (const [listenerId, listener] of this.listeners.entries()) {
      if (!channel || listener.channel === channel) {
        this.unsubscribe(listenerId);
        count++;
      }
    }

    return count;
  }

  /**
   * Get all active listeners
   */
  getListeners(channel?: SubscriptionChannel): SubscriptionListener[] {
    const result: SubscriptionListener[] = [];

    for (const listener of this.listeners.values()) {
      if (!channel || listener.channel === channel) {
        result.push(listener);
      }
    }

    return result;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve();
        return;
      }

      // Unsubscribe all listeners
      this.unsubscribeAll();

      // Close connection
      this.socket.close(1000, 'Normal closure');
      this.socket = null;

      setTimeout(resolve, 100);
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private sendMessage(message: { type: string; [key: string]: any }): void {
    if (!this.isConnected()) {
      this.messageQueue.push(message);
      console.warn('WebSocket not connected. Message queued.');
      return;
    }

    try {
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.messageQueue.push(message);
    }
  }

  private handleMessage(message: any): void {
    const { type, listenerId, channel, data } = message;

    switch (type) {
      case 'data':
        this.distributeData(listenerId, data);
        break;

      case 'error':
        this.distributeError(listenerId, new Error(message.error));
        break;

      case 'ping':
        this.sendMessage({ type: 'pong' });
        break;

      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }

  private distributeData(listenerId: string, data: any): void {
    const listener = this.listeners.get(listenerId);

    if (!listener) {
      console.warn(`Listener ${listenerId} not found for data distribution`);
      return;
    }

    try {
      listener.options.onData(data);
    } catch (error) {
      console.error(`Error in listener callback (${listenerId}):`, error);
    }
  }

  private distributeError(listenerId: string, error: Error): void {
    const listener = this.listeners.get(listenerId);

    if (!listener || !listener.options.onError) {
      console.error(`Error for listener ${listenerId}:`, error);
      return;
    }

    try {
      listener.options.onError(error);
    } catch (callbackError) {
      console.error(`Error in error callback (${listenerId}):`, callbackError);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// ============================================================================
// React Hook for Subscriptions
// ============================================================================

import { useEffect, useRef, useState } from 'react';

export function useWebSocketSubscription<T>(
  channel: SubscriptionChannel,
  context: Record<string, any> = {},
  initialData?: T
): {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isConnected: boolean;
} {
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(wsService.isConnected());
  const listenerIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Ensure WebSocket is connected
    if (!wsService.isConnected()) {
      wsService.connect().catch(setError);
    }

    // Subscribe to channel
    const listenerId = wsService.subscribe(channel, context, {
      onData: (newData) => {
        setData(newData);
        setIsLoading(false);
        setError(null);
      },
      onError: (err) => {
        setError(err);
        setIsLoading(false);
      },
    });

    listenerIdRef.current = listenerId;
    setIsConnected(wsService.isConnected());

    // Check connection status periodically
    const connectionCheckInterval = setInterval(() => {
      setIsConnected(wsService.isConnected());
    }, 5000);

    // Cleanup
    return () => {
      if (listenerIdRef.current) {
        wsService.unsubscribe(listenerIdRef.current);
      }
      clearInterval(connectionCheckInterval);
    };
  }, [channel, JSON.stringify(context)]);

  return { data, error, isLoading, isConnected };
}
