'use client';

/**
 * DemiurgeSplineWorld
 * 
 * The next-generation immersive interface powered by Spline.
 * Connects Spline scenes to blockchain data for a living, reactive environment.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplineScene, SplineSceneRef } from './SplineScene';
import type { Application } from '@splinetool/runtime';
import { useChainInfo } from '@/hooks/useChainData';
import { useBalance } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface DemiurgeSplineWorldProps {
  /** Main scene URL */
  sceneUrl: string;
  /** Alternative scenes for different zones */
  zoneScenes?: Record<string, string>;
  /** Enable blockchain data binding */
  enableDataBinding?: boolean;
  /** Update interval for data refresh (ms) */
  dataRefreshInterval?: number;
  /** Show HUD overlay */
  showHUD?: boolean;
  /** Custom className */
  className?: string;
}

interface DataBindings {
  blockHeight: number;
  validators: number;
  isConnected: boolean;
  cgtBalance: string;
  energy: number;
}

// ============================================================================
// HUD Components
// ============================================================================

function DataHUD({ data }: { data: DataBindings }) {
  return (
    <motion.div
      className="fixed top-6 right-6 z-50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-3 min-w-48">
        {/* Connection status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs font-mono text-text-secondary">
              {data.isConnected ? 'SYNCED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Block height */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">Block</span>
          <span className="text-sm font-mono text-neon-cyan">
            {data.blockHeight.toLocaleString()}
          </span>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">CGT</span>
          <span className="text-sm font-mono text-yellow-400">
            {data.cgtBalance}
          </span>
        </div>

        {/* Validators */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">Validators</span>
          <span className="text-sm font-mono text-green-400">
            {data.validators}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function NavigationHUD({ currentZone, onZoneChange }: { 
  currentZone: string; 
  onZoneChange: (zone: string) => void;
}) {
  const zones = ['command', 'social', 'assets', 'data', 'experience'];
  
  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="glass-panel px-4 py-3 rounded-full border border-white/10">
        <div className="flex items-center gap-2">
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => onZoneChange(zone)}
              className={cn(
                'px-4 py-1.5 rounded-full font-display text-xs tracking-wider uppercase transition-all duration-300',
                currentZone === zone
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ControlsHUD() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="glass-panel px-3 py-2 rounded-lg border border-white/10">
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Click</kbd>
            <span>Interact</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Drag</kbd>
            <span>Orbit</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Scroll</kbd>
            <span>Zoom</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DemiurgeSplineWorld({
  sceneUrl,
  zoneScenes = {},
  enableDataBinding = true,
  dataRefreshInterval = 5000,
  showHUD = true,
  className,
}: DemiurgeSplineWorldProps) {
  const splineRef = useRef<SplineSceneRef>(null);
  const [currentZone, setCurrentZone] = useState('command');
  const [activeSceneUrl, setActiveSceneUrl] = useState(sceneUrl);
  const [isLoaded, setIsLoaded] = useState(false);

  // Blockchain data hooks
  const { user } = useAuth();
  const chainInfo = useChainInfo();
  const walletAddress = user?.on_chain?.address || user?.on_chain_address;
  const balance = useBalance(walletAddress);

  // Computed data
  const dataBindings: DataBindings = {
    blockHeight: chainInfo.blockHeight || 0,
    validators: chainInfo.validators || 0,
    isConnected: chainInfo.isConnected,
    cgtBalance: balance.data ? (Number(balance.data) / 1e18).toFixed(2) : '0.00',
    energy: 100, // TODO: Hook up to energy system
  };

  // Update Spline variables when blockchain data changes
  useEffect(() => {
    if (!enableDataBinding || !isLoaded) return;

    const spline = splineRef.current;
    if (!spline) return;

    // Update Spline variables with blockchain data
    try {
      spline.setVariable('blockHeight', dataBindings.blockHeight);
      spline.setVariable('validators', dataBindings.validators);
      spline.setVariable('cgtBalance', parseFloat(dataBindings.cgtBalance));
      spline.setVariable('isConnected', dataBindings.isConnected);
      spline.setVariable('energy', dataBindings.energy);
    } catch (e) {
      // Variables might not exist in scene
    }
  }, [dataBindings, enableDataBinding, isLoaded]);

  // Handle zone changes
  const handleZoneChange = useCallback((zone: string) => {
    setCurrentZone(zone);
    
    // If we have a scene for this zone, switch to it
    if (zoneScenes[zone]) {
      setActiveSceneUrl(zoneScenes[zone]);
      setIsLoaded(false);
    } else {
      // Emit zone change event to current scene
      splineRef.current?.emitEvent(`zone_${zone}`);
    }
  }, [zoneScenes]);

  // Handle scene load
  const handleLoad = useCallback((spline: Application) => {
    setIsLoaded(true);
    console.log('[DemiurgeWorld] Scene loaded');
    
    // Set initial zone
    try {
      spline.setVariable('currentZone', currentZone);
    } catch (e) {
      // Variable might not exist
    }
  }, [currentZone]);

  // Handle object clicks
  const handleMouseDown = useCallback((e: any) => {
    const objectName = e.target?.name;
    if (!objectName) return;

    console.log('[DemiurgeWorld] Clicked:', objectName);

    // Handle special objects
    if (objectName.startsWith('zone_')) {
      const zone = objectName.replace('zone_', '');
      handleZoneChange(zone);
    }
  }, [handleZoneChange]);

  return (
    <div className={cn('fixed inset-0 bg-architect-bg', className)}>
      {/* Spline Scene */}
      <SplineScene
        ref={splineRef}
        scene={activeSceneUrl}
        onLoad={handleLoad}
        onMouseDown={handleMouseDown}
        showLoading={true}
        debug={process.env.NODE_ENV === 'development'}
      />

      {/* HUD Overlays */}
      <AnimatePresence>
        {showHUD && isLoaded && (
          <>
            <DataHUD data={dataBindings} />
            <NavigationHUD 
              currentZone={currentZone} 
              onZoneChange={handleZoneChange} 
            />
            <ControlsHUD />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DemiurgeSplineWorld;
