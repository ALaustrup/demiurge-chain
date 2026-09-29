'use client';

/**
 * SplineHero
 * 
 * Immersive 3D hero section powered by Spline.
 * Designed for landing pages with scroll-driven interactions.
 * 
 * Features:
 * - Full-screen 3D background
 * - Scroll-triggered animations via variables
 * - Mouse parallax effect
 * - Real-time blockchain data display
 * - Responsive overlay content
 * 
 * @see https://docs.spline.design/interaction-states-events-and-actions/variables
 */

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { SplineScene, SplineSceneRef } from './SplineScene';
import type { Application } from '@splinetool/runtime';
import { useChainInfo } from '@/hooks/useChainData';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SplineHeroProps {
  /** Spline scene URL */
  sceneUrl: string;
  /** Hero title */
  title?: string;
  /** Hero subtitle */
  subtitle?: string;
  /** Call-to-action content */
  children?: ReactNode;
  /** Enable scroll-based parallax */
  enableScrollEffect?: boolean;
  /** Enable mouse parallax in Spline */
  enableMouseParallax?: boolean;
  /** Sync blockchain data to Spline variables */
  enableBlockchainSync?: boolean;
  /** Height of the hero section */
  height?: 'screen' | 'large' | 'medium';
  /** Custom overlay gradient */
  overlayGradient?: string;
  /** Custom className */
  className?: string;
}

// Height mappings
const HEIGHT_CLASSES = {
  screen: 'h-screen',
  large: 'h-[80vh]',
  medium: 'h-[60vh]',
};

// ============================================================================
// Blockchain Stats Display
// ============================================================================

function BlockchainStats() {
  const chainInfo = useChainInfo();

  return (
    <motion.div
      className="flex items-center gap-6 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          chainInfo.isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        )} />
        <span className="text-text-tertiary">
          {chainInfo.isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-text-tertiary">BLOCK</span>
        <span className="font-mono text-neon-cyan">
          {chainInfo.blockHeight?.toLocaleString() || '---'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-text-tertiary">VALIDATORS</span>
        <span className="font-mono text-green-400">
          {chainInfo.validators || '---'}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Scroll Progress Indicator
// ============================================================================

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
    >
      <span className="text-xs text-text-tertiary uppercase tracking-wider">Scroll to explore</span>
      <motion.div
        className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2"
        animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(102,252,241,0.5)', 'rgba(255,255,255,0.2)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="w-1 h-2 bg-neon-cyan rounded-full"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SplineHero({
  sceneUrl,
  title,
  subtitle,
  children,
  enableScrollEffect = true,
  enableMouseParallax = true,
  enableBlockchainSync = true,
  height = 'screen',
  overlayGradient,
  className,
}: SplineHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<SplineSceneRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Blockchain data
  const chainInfo = useChainInfo();

  // Scroll progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Scroll transforms
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const sceneScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // Mouse tracking for parallax
  useEffect(() => {
    if (!enableMouseParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });

      // Update Spline mouse variables
      if (isLoaded && splineRef.current) {
        try {
          splineRef.current.setVariable('mouseX', (x - 0.5) * 2);
          splineRef.current.setVariable('mouseY', (y - 0.5) * 2);
        } catch {
          // Variables might not exist
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableMouseParallax, isLoaded]);

  // Sync blockchain data to Spline
  useEffect(() => {
    if (!enableBlockchainSync || !isLoaded) return;

    const spline = splineRef.current;
    if (!spline) return;

    try {
      spline.setVariable('blockHeight', chainInfo.blockHeight || 0);
      spline.setVariable('validators', chainInfo.validators || 0);
      spline.setVariable('isConnected', chainInfo.isConnected);
    } catch {
      // Variables might not exist in scene
    }
  }, [enableBlockchainSync, isLoaded, chainInfo]);

  // Sync scroll progress to Spline
  useEffect(() => {
    if (!enableScrollEffect || !isLoaded) return;

    const unsubscribe = scrollYProgress.on('change', (value) => {
      try {
        splineRef.current?.setVariable('scrollProgress', value);
      } catch {
        // Variable might not exist
      }
    });

    return unsubscribe;
  }, [enableScrollEffect, isLoaded, scrollYProgress]);

  // Handle scene load
  const handleLoad = useCallback((app: Application) => {
    setIsLoaded(true);
    
    // Set initial variables
    try {
      app.setVariable('scrollProgress', 0);
      app.setVariable('mouseX', 0);
      app.setVariable('mouseY', 0);
    } catch {
      // Variables might not exist
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        HEIGHT_CLASSES[height],
        className
      )}
    >
      {/* Spline 3D Background */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          opacity: enableScrollEffect ? sceneOpacity : 1,
          scale: enableScrollEffect ? sceneScale : 1,
        }}
      >
        <SplineScene
          ref={splineRef}
          scene={sceneUrl}
          onLoad={handleLoad}
          showLoading={true}
          className="w-full h-full"
        />
      </motion.div>

      {/* Overlay Gradient */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          overlayGradient || 'bg-gradient-to-b from-transparent via-transparent to-architect-bg/80'
        )}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ y: enableScrollEffect ? contentY : 0 }}
      >
        <AnimatePresence>
          {isLoaded && (
            <>
              {/* Blockchain Stats */}
              {enableBlockchainSync && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  <BlockchainStats />
                </div>
              )}

              {/* Title */}
              {title && (
                <motion.h1
                  className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-white mb-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {title}
                </motion.h1>
              )}

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  className="text-lg md:text-xl text-text-secondary max-w-2xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* CTA Content */}
              {children && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  {children}
                </motion.div>
              )}

              {/* Scroll Indicator */}
              <ScrollIndicator />
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SplineHero;
