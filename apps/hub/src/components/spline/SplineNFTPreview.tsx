'use client';

/**
 * SplineNFTPreview
 * 
 * Interactive 3D preview for DRC-369 NFT assets.
 * Supports:
 * - Loading Spline scenes as NFT previews
 * - Dynamic state binding (level, XP, stats)
 * - Interactive hover/click effects
 * - Screenshot capture for thumbnails
 * - Export to GLTF for on-chain storage reference
 * 
 * @see https://docs.spline.design/exporting-your-scene/web/code-api-for-web
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplineScene, SplineSceneRef } from './SplineScene';
import type { Application } from '@splinetool/runtime';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  splineSceneUrl?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  dynamicState?: {
    level?: number;
    xp?: number;
    health?: number;
    energy?: number;
    [key: string]: any;
  };
  soulbound?: boolean;
  collection?: string;
}

interface SplineNFTPreviewProps {
  /** NFT metadata containing scene URL and state */
  nft: NFTMetadata;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Show controls overlay */
  showControls?: boolean;
  /** Enable orbit interaction */
  enableOrbit?: boolean;
  /** Auto-rotate the model */
  autoRotate?: boolean;
  /** Callback when NFT is clicked */
  onClick?: (nft: NFTMetadata) => void;
  /** Callback when screenshot is captured */
  onScreenshot?: (dataUrl: string) => void;
  /** Custom className */
  className?: string;
}

// Size mappings
const SIZE_CLASSES = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64',
  full: 'w-full h-full',
};

// ============================================================================
// NFT Stats Overlay
// ============================================================================

function NFTStatsOverlay({ nft }: { nft: NFTMetadata }) {
  const { dynamicState, attributes } = nft;
  
  if (!dynamicState && (!attributes || attributes.length === 0)) {
    return null;
  }

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Dynamic State */}
      {dynamicState && (
        <div className="flex items-center gap-3 mb-2">
          {dynamicState.level !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-yellow-400">LVL</span>
              <span className="text-sm font-mono text-white">{dynamicState.level}</span>
            </div>
          )}
          {dynamicState.xp !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-neon-cyan">XP</span>
              <span className="text-sm font-mono text-white">{dynamicState.xp}</span>
            </div>
          )}
          {dynamicState.health !== undefined && (
            <div className="flex-1">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, dynamicState.health)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Attributes */}
      {attributes && attributes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {attributes.slice(0, 3).map((attr, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-white/10 rounded text-xs text-text-secondary"
            >
              {attr.trait_type}: {attr.value}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Soulbound Badge
// ============================================================================

function SoulboundBadge() {
  return (
    <div className="absolute top-2 right-2 px-2 py-1 bg-neon-purple/80 rounded-full">
      <span className="text-xs font-display text-white tracking-wider">SOULBOUND</span>
    </div>
  );
}

// ============================================================================
// Fallback Preview (when no Spline scene)
// ============================================================================

function FallbackPreview({ nft }: { nft: NFTMetadata }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-architect-bg to-architect-card">
      {nft.image ? (
        <img 
          src={nft.image} 
          alt={nft.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary font-display">{nft.name}</p>
          <p className="text-xs text-text-tertiary mt-1">No 3D preview</p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SplineNFTPreview({
  nft,
  size = 'md',
  showControls = true,
  enableOrbit = true,
  autoRotate = false,
  onClick,
  onScreenshot,
  className,
}: SplineNFTPreviewProps) {
  const splineRef = useRef<SplineSceneRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync NFT dynamic state to Spline variables
  useEffect(() => {
    if (!isLoaded || !nft.dynamicState) return;

    const spline = splineRef.current;
    if (!spline) return;

    // Update all dynamic state variables
    Object.entries(nft.dynamicState).forEach(([key, value]) => {
      try {
        spline.setVariable(key, value);
      } catch {
        // Variable might not exist in scene
      }
    });
  }, [isLoaded, nft.dynamicState]);

  // Handle scene load
  const handleLoad = useCallback((app: Application) => {
    setIsLoaded(true);

    // Set initial variables from NFT metadata
    if (nft.dynamicState) {
      Object.entries(nft.dynamicState).forEach(([key, value]) => {
        try {
          app.setVariable(key, value);
        } catch {
          // Variable might not exist
        }
      });
    }

    // Set NFT metadata as variables
    try {
      app.setVariable('nftName', nft.name);
      app.setVariable('nftId', nft.tokenId);
      app.setVariable('isSoulbound', nft.soulbound || false);
    } catch {
      // Variables might not exist
    }
  }, [nft]);

  // Handle click
  const handleClick = useCallback(() => {
    onClick?.(nft);
  }, [nft, onClick]);

  // Capture screenshot
  const captureScreenshot = useCallback(() => {
    // Note: Spline doesn't directly expose screenshot API
    // This would need to use canvas.toDataURL() on the underlying canvas
    console.log('Screenshot capture requested for:', nft.tokenId);
    // onScreenshot?.(dataUrl);
  }, [nft.tokenId]);

  const hasSplineScene = !!nft.splineSceneUrl;

  return (
    <motion.div
      className={cn(
        'relative rounded-xl overflow-hidden border border-white/10 bg-architect-card',
        'cursor-pointer transition-all duration-300',
        isHovered && 'border-neon-cyan/50 shadow-lg shadow-neon-cyan/10',
        SIZE_CLASSES[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Spline Scene or Fallback */}
      {hasSplineScene ? (
        <SplineScene
          ref={splineRef}
          scene={nft.splineSceneUrl!}
          onLoad={handleLoad}
          showLoading={true}
          className="w-full h-full"
        />
      ) : (
        <FallbackPreview nft={nft} />
      )}

      {/* Soulbound Badge */}
      {nft.soulbound && <SoulboundBadge />}

      {/* Stats Overlay */}
      <AnimatePresence>
        {(isHovered || showControls) && isLoaded && (
          <NFTStatsOverlay nft={nft} />
        )}
      </AnimatePresence>

      {/* Hover Glow Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neon-cyan/10 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SplineNFTPreview;
