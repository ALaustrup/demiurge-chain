/**
 * Real-time blockchain subscription hooks
 * 
 * Provides WebSocket-based subscriptions for live blockchain updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BlockSummary, TransactionSummary, ValidatorSummary } from '@/lib/explorer-types';

// Subscription event types matching the backend
interface BlockNotification {
  number: number;
  hash: string;
  parent_hash: string;
  timestamp: number;
  transaction_count: number;
  author: string;
  is_finalized: boolean;
}

interface TransactionNotification {
  hash: string;
  from: string;
  to: string | null;
  nonce: number;
  status: string;
  block_number: number | null;
}

interface ValidatorNotification {
  validator: string;
  event_type: string;
  stake: string;
  block_number: number;
  details: string | null;
}

interface SubscriptionConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket subscription manager for real-time blockchain updates
 */
export function useBlockchainSubscriptions(config: SubscriptionConfig) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastBlock, setLastBlock] = useState<BlockNotification | null>(null);
  const [lastTransaction, setLastTransaction] = useState<TransactionNotification | null>(null);
  const [lastValidatorEvent, setLastValidatorEvent] = useState<ValidatorNotification | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const subscriptionIds = useRef<Map<string, number>>(new Map());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
        
        // Subscribe to all events
        subscribeToBlocks();
        subscribeToTransactions();
        subscribeToValidators();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setStatus('error');
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        subscriptionIds.current.clear();
        wsRef.current = null;
        
        // Attempt reconnection with exponential backoff
        const maxAttempts = config.maxReconnectAttempts ?? 10;
        if (reconnectAttempts.current < maxAttempts) {
          reconnectAttempts.current++;
          const baseDelay = config.reconnectInterval ?? 3000;
          const delay = baseDelay * Math.pow(1.5, Math.min(reconnectAttempts.current - 1, 6));
          setTimeout(connect, delay);
        } else {
          setError('Connection lost. Please refresh to reconnect.');
        }
      };
    } catch (e) {
      setError('Failed to connect');
      setStatus('error');
    }
  }, [config.url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    subscriptionIds.current.clear();
    setStatus('disconnected');
  }, []);

  const sendRequest = useCallback((method: string, params: any[] = []) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const id = Date.now() + Math.random();
    wsRef.current.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }));
    return id;
  }, []);

  const subscribeToBlocks = useCallback(() => {
    sendRequest('chain_subscribeNewBlocks', []);
  }, [sendRequest]);

  const subscribeToTransactions = useCallback(() => {
    sendRequest('chain_subscribeNewPendingTransactions', []);
  }, [sendRequest]);

  const subscribeToValidators = useCallback(() => {
    sendRequest('consensus_subscribeValidatorStatus', []);
  }, [sendRequest]);

  const handleMessage = useCallback((data: any) => {
    // Handle subscription notifications
    if (data.method) {
      switch (data.method) {
        case 'chain_newBlock':
          setLastBlock(data.params?.result || data.params);
          break;
        case 'chain_pendingTransaction':
          setLastTransaction(data.params?.result || data.params);
          break;
        case 'consensus_validatorStatus':
          setLastValidatorEvent(data.params?.result || data.params);
          break;
      }
    }

    // Handle subscription ID responses
    if (data.result && typeof data.result === 'number') {
      // Store subscription ID (we could track which subscription this is for)
      subscriptionIds.current.set(String(data.id), data.result);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    status,
    error,
    lastBlock,
    lastTransaction,
    lastValidatorEvent,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}

/**
 * Hook for subscribing to new blocks
 */
export function useNewBlocks(wsUrl: string, maxBlocks: number = 10) {
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const { lastBlock, status } = useBlockchainSubscriptions({ url: wsUrl });

  useEffect(() => {
    if (lastBlock) {
      const newBlock: BlockSummary = {
        hash: lastBlock.hash,
        number: lastBlock.number,
        timestamp: lastBlock.timestamp,
        transactionCount: lastBlock.transaction_count,
        validator: lastBlock.author,
        size: 0, // Not provided in notification
        finalized: lastBlock.is_finalized,
      };

      setBlocks(prev => {
        const updated = [newBlock, ...prev.filter(b => b.number !== newBlock.number)];
        return updated.slice(0, maxBlocks);
      });
    }
  }, [lastBlock, maxBlocks]);

  return { blocks, status };
}

/**
 * Hook for subscribing to new transactions
 */
export function useNewTransactions(wsUrl: string, maxTransactions: number = 10) {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const { lastTransaction, status } = useBlockchainSubscriptions({ url: wsUrl });

  useEffect(() => {
    if (lastTransaction) {
      const newTx: TransactionSummary = {
        hash: lastTransaction.hash,
        from: lastTransaction.from,
        to: lastTransaction.to,
        value: '0', // Not provided in notification
        type: 'transfer',
        status: lastTransaction.status as 'pending' | 'success' | 'failed',
        timestamp: Date.now(),
      };

      setTransactions(prev => {
        const updated = [newTx, ...prev.filter(t => t.hash !== newTx.hash)];
        return updated.slice(0, maxTransactions);
      });
    }
  }, [lastTransaction, maxTransactions]);

  return { transactions, status };
}

/**
 * Hook for subscribing to validator events
 */
export function useValidatorEvents(wsUrl: string) {
  const [events, setEvents] = useState<ValidatorNotification[]>([]);
  const { lastValidatorEvent, status } = useBlockchainSubscriptions({ url: wsUrl });

  useEffect(() => {
    if (lastValidatorEvent) {
      setEvents(prev => [lastValidatorEvent, ...prev].slice(0, 50));
    }
  }, [lastValidatorEvent]);

  return { events, status };
}

/**
 * Hook for real-time network stats
 */
export function useRealtimeStats(wsUrl: string) {
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [tps, setTps] = useState<number>(0);
  const [blockTime, setBlockTime] = useState<number>(0);
  
  const blockTimestamps = useRef<number[]>([]);
  const txCounts = useRef<number[]>([]);
  
  const { lastBlock, status } = useBlockchainSubscriptions({ url: wsUrl });

  useEffect(() => {
    if (lastBlock) {
      setBlockHeight(lastBlock.number);
      
      // Track block timestamps for block time calculation
      blockTimestamps.current.push(lastBlock.timestamp);
      if (blockTimestamps.current.length > 10) {
        blockTimestamps.current.shift();
      }
      
      // Calculate average block time
      if (blockTimestamps.current.length >= 2) {
        const times = blockTimestamps.current;
        const totalTime = times[times.length - 1] - times[0];
        const avgBlockTime = totalTime / (times.length - 1) / 1000;
        setBlockTime(Math.round(avgBlockTime * 10) / 10);
      }
      
      // Track transactions for TPS calculation
      txCounts.current.push(lastBlock.transaction_count);
      if (txCounts.current.length > 10) {
        txCounts.current.shift();
      }
      
      // Calculate TPS
      if (blockTimestamps.current.length >= 2) {
        const totalTxs = txCounts.current.reduce((a, b) => a + b, 0);
        const times = blockTimestamps.current;
        const timeSpan = (times[times.length - 1] - times[0]) / 1000;
        if (timeSpan > 0) {
          setTps(Math.round((totalTxs / timeSpan) * 100) / 100);
        }
      }
    }
  }, [lastBlock]);

  return { blockHeight, tps, blockTime, status };
}
