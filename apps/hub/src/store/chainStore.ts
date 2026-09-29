'use client';

import { create } from 'zustand';
import { demiurgeRpc, type BlockInfo, type ValidatorInfo, type ConsensusStatus } from '@/lib/demiurge-rpc';

// ═══════════════════════════════════════════════════════════════════════════
// DEMIURGE OS - Chain Store (The Nervous System)
// High-performance state management for real-time blockchain data
// ═══════════════════════════════════════════════════════════════════════════

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ChainState {
  // Connection status
  connectionStatus: ConnectionStatus;
  lastError: string | null;
  
  // Real-time chain data
  blockHeight: number;
  tps: number;
  finality: number;
  validators: number;
  totalStake: string;
  currentEra: number;
  
  // Recent blocks for TPS calculation
  recentBlocks: { number: number; timestamp: number; txCount: number }[];
  
  // Latest block info
  latestBlock: BlockInfo | null;
  
  // Validators
  validatorList: ValidatorInfo[];
  
  // Polling interval ID
  pollingIntervalId: NodeJS.Timeout | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  fetchChainData: () => Promise<void>;
  calculateTps: () => number;
}

export const useChainStore = create<ChainState>()((set, get) => ({
    // Initial state
    connectionStatus: 'disconnected',
    lastError: null,
    blockHeight: 0,
    tps: 0,
    finality: 0,
    validators: 0,
    totalStake: '0',
    currentEra: 0,
    recentBlocks: [],
    latestBlock: null,
    validatorList: [],
    pollingIntervalId: null,

    // Connect to blockchain
    connect: async () => {
      const state = get();
      if (state.connectionStatus === 'connecting' || state.connectionStatus === 'connected') {
        return;
      }

      set({ connectionStatus: 'connecting', lastError: null });

      try {
        // Initial data fetch
        await get().fetchChainData();
        
        set({ connectionStatus: 'connected' });
        
        // Start polling for updates (every 2 seconds)
        const intervalId = setInterval(async () => {
          try {
            await get().fetchChainData();
          } catch (error: any) {
            // Don't disconnect on transient errors
            console.warn('Chain data fetch failed:', error.message);
          }
        }, 2000);
        
        set({ pollingIntervalId: intervalId });
        
      } catch (error: any) {
        const isNetworkError = error.isNetworkError || error.message?.includes('unavailable');
        set({
          connectionStatus: 'error',
          lastError: isNetworkError ? 'Blockchain offline' : error.message,
        });
      }
    },

    // Disconnect from blockchain
    disconnect: () => {
      const { pollingIntervalId } = get();
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      set({
        connectionStatus: 'disconnected',
        pollingIntervalId: null,
      });
    },

    // Fetch chain data
    fetchChainData: async () => {
      try {
        const [health, consensusStatus, validators, latestBlock] = await Promise.all([
          demiurgeRpc.getHealth().catch(() => null),
          demiurgeRpc.getConsensusStatus().catch(() => null),
          demiurgeRpc.getValidators().catch(() => []),
          demiurgeRpc.getLatestBlock().catch(() => null),
        ]);

        const state = get();
        
        // Track recent blocks for TPS calculation
        let recentBlocks = [...state.recentBlocks];
        if (latestBlock && latestBlock.number !== state.blockHeight) {
          recentBlocks.push({
            number: latestBlock.number,
            timestamp: latestBlock.timestamp || Date.now(),
            txCount: latestBlock.transactions?.length || 0,
          });
          // Keep only last 30 seconds of blocks
          const thirtySecondsAgo = Date.now() - 30000;
          recentBlocks = recentBlocks.filter(b => b.timestamp > thirtySecondsAgo);
        }

        set({
          blockHeight: consensusStatus?.blockNumber || latestBlock?.number || state.blockHeight,
          finality: health?.finality || 2000,
          validators: validators.length || consensusStatus?.validators || 0,
          totalStake: consensusStatus?.totalStake || '0',
          currentEra: consensusStatus?.currentEra || 0,
          validatorList: validators,
          latestBlock: latestBlock || state.latestBlock,
          recentBlocks,
          tps: get().calculateTps(),
          connectionStatus: 'connected',
          lastError: null,
        });
      } catch (error: any) {
        // Don't reset state on transient errors
        if (error.isNetworkError) {
          set({ lastError: 'Blockchain offline' });
        }
        throw error;
      }
    },

    // Calculate TPS from recent blocks
    calculateTps: (): number => {
      const { recentBlocks } = get();
      if (recentBlocks.length < 2) return 0;
      
      const totalTx = recentBlocks.reduce((sum, b) => sum + b.txCount, 0);
      const timespan = (recentBlocks[recentBlocks.length - 1].timestamp - recentBlocks[0].timestamp) / 1000;
      
      if (timespan <= 0) return 0;
      return Math.round((totalTx / timespan) * 10) / 10;
    },
  }));

// ═══════════════════════════════════════════════════════════════════════════
// Selectors for optimized component subscriptions
// ═══════════════════════════════════════════════════════════════════════════

export const selectBlockHeight = (state: ChainState) => state.blockHeight;
export const selectTps = (state: ChainState) => state.tps;
export const selectFinality = (state: ChainState) => state.finality;
export const selectValidators = (state: ChainState) => state.validators;
export const selectConnectionStatus = (state: ChainState) => state.connectionStatus;
export const selectTotalStake = (state: ChainState) => state.totalStake;
export const selectCurrentEra = (state: ChainState) => state.currentEra;
