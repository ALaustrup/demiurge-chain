'use client';

/**
 * Scene Manager
 * 
 * The root 3D canvas and scene orchestrator for the immersive world.
 * Manages the Three.js canvas, post-processing, and zone rendering.
 */

import { Suspense, useEffect, useState, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

import { WorldProvider, useWorldStore } from './WorldProvider';
import { CameraController } from './CameraController';
import { CommandChamber } from './zones/CommandChamber';
import { EnvironmentLighting } from './environment/Lighting';
import { WorldParticles } from './environment/Particles';
import { HexagonalFloor } from './environment/Floor';

// ============================================================================
// Types
// ============================================================================

interface SceneManagerProps {
  children?: ReactNode;
  showStats?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

// ============================================================================
// Loading Fallback
// ============================================================================

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#FF6A00" wireframe />
    </mesh>
  );
}

// ============================================================================
// Post Processing
// ============================================================================

function PostProcessingLow() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
      />
    </EffectComposer>
  );
}

function PostProcessingMedium() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function PostProcessingHigh() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0005, 0.0005)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function PostProcessingUltra() {
  return (
    <EffectComposer multisampling={8}>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0005, 0.0005)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
      <DepthOfField
        focusDistance={0.01}
        focalLength={0.02}
        bokehScale={2}
      />
    </EffectComposer>
  );
}

function PostProcessing() {
  const quality = useWorldStore((state) => state.quality);
  
  switch (quality) {
    case 'low':
      return <PostProcessingLow />;
    case 'medium':
      return <PostProcessingMedium />;
    case 'high':
      return <PostProcessingHigh />;
    case 'ultra':
      return <PostProcessingUltra />;
    default:
      return <PostProcessingMedium />;
  }
}

// ============================================================================
// Scene Content
// ============================================================================

function SceneContent() {
  const currentZone = useWorldStore((state) => state.currentZone);
  const setLoaded = useWorldStore((state) => state.setLoaded);
  
  useEffect(() => {
    // Mark world as loaded after initial render
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, [setLoaded]);
  
  return (
    <>
      {/* Camera */}
      <CameraController />
      
      {/* Environment */}
      <EnvironmentLighting />
      <WorldParticles />
      <HexagonalFloor />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#0B0C10', 10, 50]} />
      
      {/* Zones */}
      {currentZone === 'command' && <CommandChamber />}
      
      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

// ============================================================================
// Scene Manager Component
// ============================================================================

export function SceneManager({ children, showStats = false, quality = 'high' }: SceneManagerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Only render on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 bg-architect-bg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-neon-cyan font-display text-xl tracking-wider animate-pulse">
            INITIALIZING WORLD...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <WorldProvider>
      <div className="fixed inset-0 -z-10">
        <Canvas
          camera={{
            fov: 60,
            near: 0.1,
            far: 1000,
            position: [0, 3, 8],
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
          }}
          shadows
          flat
        >
          {/* Color management */}
          <color attach="background" args={['#0B0C10']} />
          
          {/* Adaptive performance */}
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          
          {/* Scene content with suspense */}
          <Suspense fallback={<LoadingFallback />}>
            <SceneContent />
            <Preload all />
          </Suspense>
          
          {/* Debug stats */}
          {showStats && process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>
      </div>
      
      {/* HTML overlay content */}
      {children}
    </WorldProvider>
  );
}

export default SceneManager;
