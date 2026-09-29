'use client';

/**
 * DynamicSplineScene
 * 
 * An enhanced Spline scene component that automatically syncs with
 * Demiurge blockchain data. Provides real-time visualization of
 * on-chain state with smooth animations.
 * 
 * Features:
 * - Automatic blockchain data binding
 * - Animation helpers for smooth transitions
 * - Event system for chain events (new block, transaction)
 * - Fallback rendering when scene fails to load
 * - Responsive and performant
 * 
 * Usage:
 * ```tsx
 * <DynamicSplineScene
 *   scene="https://prod.spline.design/xxx/scene.splinecode"
 *   preset="dashboard"
 *   showBlockHeight
 *   onNewBlock={() => console.log('New block!')}
 * />
 * ```
 */

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SplineScene, { SplineSceneRef, SplineSceneProps } from './SplineScene';
import useSplineBlockchain, { SPLINE_PRESETS, BlockchainVariables } from './useSplineBlockchain';

// ============================================================================
// Types
// ============================================================================

export interface DynamicSplineSceneProps extends Omit<SplineSceneProps, 'scene'> {
  /** Spline scene URL */
  scene: string;
  /** Preset variable mapping */
  preset?: keyof typeof SPLINE_PRESETS;
  /** Custom variable name mappings */
  variableNames?: Partial<Record<keyof BlockchainVariables, string>>;
  /** Update interval in ms (default: 50 for smooth animations) */
  updateInterval?: number;
  /** Include user-specific data (requires auth) */
  includeUserData?: boolean;
  /** Show block height overlay */
  showBlockHeight?: boolean;
  /** Show connection status indicator */
  showConnectionStatus?: boolean;
  /** Show debug info */
  showDebugPanel?: boolean;
  /** Called on new block */
  onNewBlock?: (blockHeight: number) => void;
  /** Called when variables update */
  onVariablesUpdate?: (variables: BlockchainVariables) => void;
  /** Fallback component when scene fails */
  fallback?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
}

// ============================================================================
// Overlays
// ============================================================================

function BlockHeightOverlay({ blockHeight, isConnected }: { blockHeight: number; isConnected: boolean }) {
  return (
    <motion.div
      className="absolute top-4 left-4 z-20 pointer-events-none"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        )} />
        <span className="font-mono text-sm text-white/80">
          Block #{blockHeight.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <motion.div
      className="absolute top-4 right-4 z-20 pointer-events-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border',
        isConnected 
          ? 'bg-green-500/20 border-green-500/30 text-green-300'
          : 'bg-red-500/20 border-red-500/30 text-red-300'
      )}>
        {isConnected ? '● Connected' : '○ Disconnected'}
      </div>
    </motion.div>
  );
}

function DebugPanel({ variables }: { variables: BlockchainVariables }) {
  return (
    <motion.div
      className="absolute bottom-4 left-4 z-20 max-w-xs"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="p-3 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 font-mono text-xs text-white/70 overflow-auto max-h-48">
        <div className="text-white/50 mb-2">Spline Variables:</div>
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4">
            <span className="text-cyan-400">{key}:</span>
            <span className="text-white/80">
              {typeof value === 'number' ? value.toFixed(2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DefaultFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" />
        <p className="text-white/60 text-sm">3D Scene Unavailable</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DynamicSplineScene({
  scene,
  preset,
  variableNames: customVariableNames,
  updateInterval = 50, // Fast for smooth animations
  includeUserData = true,
  showBlockHeight = false,
  showConnectionStatus = false,
  showDebugPanel = false,
  onNewBlock,
  onVariablesUpdate,
  fallback,
  containerClassName,
  className,
  onLoad,
  ...props
}: DynamicSplineSceneProps) {
  const splineRef = useRef<SplineSceneRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevBlockRef = useRef(0);

  // Merge preset with custom variable names
  const variableNames = {
    ...(preset ? SPLINE_PRESETS[preset] : {}),
    ...customVariableNames,
  };

  // Hook up blockchain data
  const { variables, isConnected, newBlockEvent } = useSplineBlockchain({
    splineRef,
    updateInterval,
    includeUserData,
    variableNames,
    onUpdate: (vars) => {
      onVariablesUpdate?.(vars);
      
      // Trigger new block callback
      if (vars.blockHeight > prevBlockRef.current && prevBlockRef.current > 0) {
        onNewBlock?.(vars.blockHeight);
      }
      prevBlockRef.current = vars.blockHeight;
    },
  });

  // Handle scene load
  const handleLoad = useCallback((spline: any) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(spline);
  }, [onLoad]);

  // Handle scene error
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <div className={cn('relative w-full h-full', containerClassName)}>
      {/* Main Spline Scene */}
      {!hasError ? (
        <SplineScene
          ref={splineRef}
          scene={scene}
          className={className}
          onLoad={handleLoad}
          {...props}
        />
      ) : (
        fallback || <DefaultFallback />
      )}

      {/* Overlays */}
      <AnimatePresence>
        {isLoaded && showBlockHeight && (
          <BlockHeightOverlay 
            blockHeight={variables.blockHeight} 
            isConnected={isConnected} 
          />
        )}
        
        {isLoaded && showConnectionStatus && (
          <ConnectionStatus isConnected={isConnected} />
        )}
        
        {isLoaded && showDebugPanel && (
          <DebugPanel variables={variables} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default DynamicSplineScene;
