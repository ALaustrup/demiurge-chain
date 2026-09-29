'use client';

/**
 * World HUD
 * 
 * Heads-up display overlay for the immersive world.
 * Replaces the traditional navbar with floating UI elements.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore, ZONES, ZoneId } from '@/world/WorldProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useWalletData';
import { useChainInfo } from '@/hooks/useChainData';
import { soundManager } from '@/lib/audio/SoundManager';
import { cn } from '@/lib/utils';

// ============================================================================
// Zone Indicator
// ============================================================================

function ZoneIndicator() {
  const currentZone = useWorldStore((state) => state.currentZone);
  const isTransitioning = useWorldStore((state) => state.isTransitioning);
  const zone = ZONES[currentZone];
  
  return (
    <motion.div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass-panel px-6 py-2 rounded-full border border-white/10">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isTransitioning ? 'animate-pulse bg-yellow-400' : 'bg-neon-cyan'
            )}
            style={{ backgroundColor: zone.color }}
          />
          
          {/* Zone name */}
          <span className="font-display text-sm tracking-wider text-text-primary uppercase">
            {zone.name}
          </span>
          
          {/* Transition indicator */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs text-text-tertiary"
              >
                TRANSITIONING...
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// User Identity
// ============================================================================

function UserIdentity() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const displayName = user.qor_id?.split('#')[0] || 'User';
  const discriminator = user.qor_id?.split('#')[1] || '0000';
  
  return (
    <motion.div
      className="fixed top-6 left-6 z-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <span className="font-display text-xs text-void-deep font-bold">
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
          
          {/* Name */}
          <div>
            <div className="font-display text-sm tracking-wider text-text-primary">
              {displayName}
            </div>
            <div className="text-xs font-mono text-text-tertiary">
              #{discriminator}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Wallet Balance HUD
// ============================================================================

function WalletHUD() {
  const { user } = useAuth();
  const walletAddress = user?.on_chain?.address || user?.on_chain_address;
  const balance = useBalance(walletAddress);
  const chainInfo = useChainInfo();
  
  const cgtBalance = balance.data ? (Number(balance.data) / 1e18).toFixed(2) : '0.00';
  
  return (
    <motion.div
      className="fixed top-6 right-6 z-50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
        <div className="flex items-center gap-4">
          {/* Chain status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                chainInfo.isConnected ? 'bg-green-400' : 'bg-red-400'
              )}
            />
            <span className="text-xs font-mono text-text-tertiary">
              {chainInfo.isConnected ? 'SYNCED' : 'OFFLINE'}
            </span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-white/10" />
          
          {/* Balance */}
          <div className="text-right">
            <div className="font-mono text-sm text-neon-cyan">
              {cgtBalance} CGT
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Zone Navigation
// ============================================================================

function ZoneNav() {
  const currentZone = useWorldStore((state) => state.currentZone);
  const setZone = useWorldStore((state) => state.setZone);
  const isTransitioning = useWorldStore((state) => state.isTransitioning);
  
  const zones: ZoneId[] = ['command', 'social', 'assets', 'data', 'experience'];
  
  const handleZoneClick = (zone: ZoneId) => {
    if (zone !== currentZone && !isTransitioning) {
      soundManager.playTransition();
      setZone(zone);
    }
  };
  
  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="glass-panel px-4 py-3 rounded-full border border-white/10">
        <div className="flex items-center gap-2">
          {zones.map((zoneId) => {
            const zone = ZONES[zoneId];
            const isActive = currentZone === zoneId;
            
            return (
              <button
                key={zoneId}
                onClick={() => handleZoneClick(zoneId)}
                disabled={isTransitioning}
                className={cn(
                  'px-4 py-1.5 rounded-full font-display text-xs tracking-wider uppercase',
                  'transition-all duration-300',
                  isActive
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
                  isTransitioning && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  color: isActive ? zone.color : undefined,
                  borderColor: isActive ? `${zone.color}50` : undefined,
                  backgroundColor: isActive ? `${zone.color}20` : undefined,
                }}
              >
                {zone.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Controls Help
// ============================================================================

function ControlsHelp() {
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
// Audio Toggle
// ============================================================================

function AudioToggle() {
  const audioEnabled = useWorldStore((state) => state.audioEnabled);
  const setAudioEnabled = useWorldStore((state) => state.setAudioEnabled);
  
  useEffect(() => {
    soundManager.setEnabled(audioEnabled);
    if (audioEnabled) {
      soundManager.init();
    }
  }, [audioEnabled]);
  
  return (
    <motion.button
      className="fixed bottom-6 left-6 z-50 glass-panel p-2 rounded-lg border border-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      onClick={() => {
        setAudioEnabled(!audioEnabled);
        if (!audioEnabled) {
          soundManager.playClick();
        }
      }}
    >
      {audioEnabled ? (
        <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      )}
    </motion.button>
  );
}

// ============================================================================
// Main HUD Export
// ============================================================================

export function WorldHUD() {
  return (
    <>
      <ZoneIndicator />
      <UserIdentity />
      <WalletHUD />
      <ZoneNav />
      <ControlsHelp />
      <AudioToggle />
    </>
  );
}

export default WorldHUD;
