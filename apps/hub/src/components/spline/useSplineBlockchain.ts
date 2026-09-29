/**
 * useSplineBlockchain
 * 
 * Hook for syncing Demiurge blockchain data to Spline scene variables.
 * Enables real-time visualization of on-chain data in 3D.
 * 
 * Supported Variables (create these in your Spline scene):
 * - blockHeight (Number): Current block height
 * - validators (Number): Active validator count  
 * - tps (Number): Transactions per second
 * - isConnected (Boolean): Chain connection status
 * - cgtBalance (Number): User's CGT balance (if authenticated)
 * - energy (Number): User's energy level
 * - nftCount (Number): User's NFT count
 * - pulseIntensity (Number): 0-1 oscillating value for glow effects
 * - wavePhase (Number): 0-1 linear value for wave animations
 * - networkLoad (Number): 0-100 network utilization
 * - blockProgress (Number): 0-1 progress to next block
 * 
 * NEW: Animation helpers for smooth Spline transitions
 * NEW: Event triggers for blockchain events (new block, transaction)
 * NEW: Object manipulation based on chain state
 * 
 * @see https://docs.spline.design/interaction-states-events-and-actions/variables
 * @see https://docs.spline.design/interaction-states-events-and-actions/real-time-api
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import type { SplineSceneRef } from './SplineScene';
import { useChainInfo } from '@/hooks/useChainData';
import { useBalance } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// Types
// ============================================================================

export interface BlockchainVariables {
  // Chain state
  blockHeight: number;
  validators: number;
  tps: number;
  isConnected: boolean;
  
  // User state (if authenticated)
  cgtBalance: number;
  energy: number;
  nftCount: number;
  
  // Dynamic computed
  networkLoad: number; // 0-100
  blockProgress: number; // 0-1 (time until next block)
  
  // Animation helpers (0-1 range for Spline)
  pulseIntensity: number; // Sine wave oscillation
  wavePhase: number; // Linear 0-1 cycle
  breatheScale: number; // Smooth scaling animation
  rotationPhase: number; // 0-360 continuous rotation
  
  // Time-based
  timestamp: number;
  deltaTime: number; // Seconds since last update
}

interface UseSplineBlockchainOptions {
  /** Spline scene ref */
  splineRef: React.RefObject<SplineSceneRef | null>;
  /** Update interval in ms (default: 2000) */
  updateInterval?: number;
  /** Enable user-specific data (requires auth) */
  includeUserData?: boolean;
  /** Custom variable name mappings */
  variableNames?: Partial<Record<keyof BlockchainVariables, string>>;
  /** Callback when variables are updated */
  onUpdate?: (variables: BlockchainVariables) => void;
}

// ============================================================================
// Default Variable Names
// ============================================================================

const DEFAULT_VARIABLE_NAMES: Record<keyof BlockchainVariables, string> = {
  blockHeight: 'blockHeight',
  validators: 'validators',
  tps: 'tps',
  isConnected: 'isConnected',
  cgtBalance: 'cgtBalance',
  energy: 'energy',
  nftCount: 'nftCount',
  networkLoad: 'networkLoad',
  blockProgress: 'blockProgress',
  pulseIntensity: 'pulseIntensity',
  wavePhase: 'wavePhase',
  breatheScale: 'breatheScale',
  rotationPhase: 'rotationPhase',
  timestamp: 'timestamp',
  deltaTime: 'deltaTime',
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSplineBlockchain({
  splineRef,
  updateInterval = 2000,
  includeUserData = true,
  variableNames = {},
  onUpdate,
}: UseSplineBlockchainOptions) {
  const lastUpdateRef = useRef(0);
  const animationFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Merge variable names with defaults
  const varNames = { ...DEFAULT_VARIABLE_NAMES, ...variableNames };

  // Blockchain hooks
  const chainInfo = useChainInfo();
  const { user, isAuthenticated } = useAuth();
  const walletAddress = user?.on_chain?.address || user?.on_chain_address;
  const balance = useBalance(walletAddress);

  // Track time for animations
  const startTimeRef = useRef(Date.now());
  const lastFrameTimeRef = useRef(Date.now());
  const prevBlockHeightRef = useRef(0);
  const [newBlockEvent, setNewBlockEvent] = useState(false);

  // Build current variables object
  const buildVariables = useCallback((): BlockchainVariables => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000; // seconds
    const deltaTime = (now - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = now;
    
    const cgtBalanceRaw = balance.data ? Number(balance.data) / 1e18 : 0;
    const blockHeight = chainInfo.blockHeight || 0;
    
    // Detect new block for events
    if (blockHeight > prevBlockHeightRef.current && prevBlockHeightRef.current > 0) {
      setNewBlockEvent(true);
      setTimeout(() => setNewBlockEvent(false), 100);
    }
    prevBlockHeightRef.current = blockHeight;
    
    // Animation calculations
    const pulseIntensity = Math.sin(elapsed * 2 * Math.PI / 3) * 0.5 + 0.5; // 3 second cycle
    const wavePhase = (elapsed % 5) / 5; // 5 second cycle
    const breatheScale = Math.sin(elapsed * Math.PI / 2) * 0.05 + 1; // Subtle 4 second breathing
    const rotationPhase = (elapsed * 36) % 360; // 10 second full rotation
    
    // Block progress (assuming 6 second blocks)
    const blockTime = 6000; // ms
    const blockProgress = (now % blockTime) / blockTime;
    
    // Network load based on TPS (rough estimate)
    const tps = 0; // TODO: Implement TPS tracking
    const networkLoad = Math.min(100, tps * 10);
    
    return {
      blockHeight,
      validators: chainInfo.validators || 0,
      tps,
      isConnected: chainInfo.isConnected,
      cgtBalance: parseFloat(cgtBalanceRaw.toFixed(2)),
      energy: 100, // TODO: Hook up to energy system
      nftCount: 0, // TODO: Hook up to NFT count
      networkLoad,
      blockProgress,
      pulseIntensity,
      wavePhase,
      breatheScale,
      rotationPhase,
      timestamp: now,
      deltaTime,
    };
  }, [chainInfo, balance.data]);

  // Update Spline variables
  const updateSplineVariables = useCallback((variables: BlockchainVariables) => {
    const spline = splineRef.current;
    if (!spline) return;

    // Update each variable
    Object.entries(variables).forEach(([key, value]) => {
      const varName = varNames[key as keyof BlockchainVariables];
      if (!varName) return;

      // Skip user data if not enabled
      if (!includeUserData && ['cgtBalance', 'energy', 'nftCount'].includes(key)) {
        return;
      }

      try {
        spline.setVariable(varName, value);
      } catch {
        // Variable doesn't exist in scene - this is fine
      }
    });

    onUpdate?.(variables);
  }, [splineRef, varNames, includeUserData, onUpdate]);

  // Animation loop for smooth updates
  useEffect(() => {
    let isActive = true;

    const tick = () => {
      if (!isActive) return;

      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        const variables = buildVariables();
        updateSplineVariables(variables);
        lastUpdateRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [buildVariables, updateSplineVariables, updateInterval]);

  // Emit Spline event on new block
  useEffect(() => {
    if (newBlockEvent && splineRef.current) {
      try {
        splineRef.current.emitEvent('newBlock');
      } catch {
        // Event might not exist in scene
      }
    }
  }, [newBlockEvent, splineRef]);

  // Return current state for external use
  return {
    variables: buildVariables(),
    isConnected: chainInfo.isConnected,
    isAuthenticated,
    newBlockEvent,
    updateNow: () => {
      const variables = buildVariables();
      updateSplineVariables(variables);
      return variables;
    },
    // Emit custom event to Spline
    emitEvent: (eventName: string) => {
      if (splineRef.current) {
        try {
          splineRef.current.emitEvent(eventName);
        } catch {
          console.warn(`[SplineBlockchain] Failed to emit event: ${eventName}`);
        }
      }
    },
    // Animate object based on blockchain data
    animateObject: (objectName: string, property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => {
      const spline = splineRef.current?.getSpline();
      if (!spline) return;
      
      const obj = spline.findObjectByName(objectName);
      if (obj) {
        obj[property][axis] = value;
      }
    },
  };
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Preset variable names for common Spline scene templates
 */
export const SPLINE_PRESETS = {
  /** Standard Demiurge dashboard scene */
  dashboard: {
    blockHeight: 'block_height',
    validators: 'validator_count',
    tps: 'transactions_per_second',
    isConnected: 'chain_connected',
    cgtBalance: 'wallet_balance',
    energy: 'user_energy',
    nftCount: 'nft_owned',
    networkLoad: 'network_load',
    blockProgress: 'block_timer',
    pulseIntensity: 'glow_intensity',
    wavePhase: 'wave_progress',
    breatheScale: 'breathe_scale',
    rotationPhase: 'rotation',
  },
  
  /** Minimal scene with just chain data */
  minimal: {
    blockHeight: 'blocks',
    validators: 'nodes',
    isConnected: 'online',
    pulseIntensity: 'pulse',
  },
  
  /** NFT-focused scene */
  nftGallery: {
    cgtBalance: 'balance',
    nftCount: 'total_nfts',
    energy: 'energy_level',
    pulseIntensity: 'highlight',
    rotationPhase: 'spin',
  },
  
  /** Hero/landing page scene */
  hero: {
    blockHeight: 'chain_blocks',
    validators: 'active_nodes',
    isConnected: 'network_status',
    pulseIntensity: 'glow',
    wavePhase: 'wave',
    breatheScale: 'scale',
    rotationPhase: 'rotate',
    networkLoad: 'activity',
  },
  
  /** Wallet/finance scene */
  wallet: {
    cgtBalance: 'balance',
    energy: 'power',
    nftCount: 'assets',
    blockProgress: 'sync_progress',
    pulseIntensity: 'pulse',
  },
} as const;

/**
 * Spline scene variable documentation
 * 
 * Copy these into your Spline scene's Variables panel:
 * 
 * Chain Data:
 * - blockHeight (Number): Current blockchain height
 * - validators (Number): Active validator count
 * - tps (Number): Transactions per second
 * - isConnected (Boolean): true if connected to chain
 * - networkLoad (Number): 0-100 network utilization
 * - blockProgress (Number): 0-1 progress to next block
 * 
 * User Data:
 * - cgtBalance (Number): User's CGT token balance
 * - energy (Number): User's energy points
 * - nftCount (Number): User's NFT count
 * 
 * Animation Helpers:
 * - pulseIntensity (Number): 0-1 sine wave (3s cycle) - use for glow/breathing
 * - wavePhase (Number): 0-1 linear (5s cycle) - use for waves/progress
 * - breatheScale (Number): ~0.95-1.05 scale factor - use for subtle breathing
 * - rotationPhase (Number): 0-360 degrees (10s cycle) - use for rotation
 * 
 * Time:
 * - timestamp (Number): Current Unix timestamp
 * - deltaTime (Number): Seconds since last frame
 */

export default useSplineBlockchain;
