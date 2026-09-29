'use client';

/**
 * World Page
 * 
 * The immersive 3D experience - "Living Operating System"
 * This is the next-generation dashboard where users navigate
 * through a 3D holographic command center.
 */

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamically import the 3D scene to avoid SSR issues
const SceneManager = dynamic(
  () => import('@/world/SceneManager').then((mod) => mod.SceneManager),
  {
    ssr: false,
    loading: () => <WorldLoadingScreen />,
  }
);

const WorldHUD = dynamic(
  () => import('@/components/holo/WorldHUD').then((mod) => mod.WorldHUD),
  { ssr: false }
);

// ============================================================================
// Loading Screen
// ============================================================================

function WorldLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-architect-bg flex flex-col items-center justify-center z-50">
      {/* Animated logo/text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Central glow */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-neon-cyan/5 blur-xl absolute inset-0 animate-pulse" />
          <div className="w-24 h-24 rounded-full border-2 border-neon-cyan/30 flex items-center justify-center relative">
            <div className="w-16 h-16 rounded-full border border-neon-cyan/50 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
              <div className="w-8 h-8 rounded-full bg-neon-cyan/20" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="font-display text-2xl tracking-wider text-neon-cyan mb-2">
          DEMIURGE
        </h1>
        <p className="font-display text-sm tracking-widest text-text-secondary uppercase">
          Initializing World
        </p>
        
        {/* Loading bar */}
        <div className="mt-8 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </div>
        
        {/* Status text */}
        <motion.p
          className="mt-4 text-xs text-text-tertiary font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading 3D environment...
        </motion.p>
      </motion.div>
      
      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-neon-cyan/30" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-neon-cyan/30" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-neon-cyan/30" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-neon-cyan/30" />
    </div>
  );
}

// ============================================================================
// World Page Component
// ============================================================================

export default function WorldPage() {
  // Prevent body scroll when in world view
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-architect-bg">
      <Suspense fallback={<WorldLoadingScreen />}>
        {/* 3D Scene */}
        <SceneManager showStats={process.env.NODE_ENV === 'development'}>
          {/* HUD Overlay */}
          <WorldHUD />
        </SceneManager>
      </Suspense>
    </div>
  );
}
