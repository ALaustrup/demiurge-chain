'use client';

/**
 * Scatter3D Game Page
 * 
 * Main entry point for the Scatter3D engine.
 * Protected by DemiurgeGate component which verifies:
 * - QOR ID authentication
 * - Minimum staking balance
 * 
 * The engine renders a 3D world entirely in ASCII characters
 * using the ScatterRenderer component.
 */

import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { DemiurgeGate } from '@/components/scatter3d/DemiurgeGate';
import ScatterRenderer from '@/components/scatter3d/ScatterRenderer';
import { Scatter3DScene } from '@/components/scatter3d/Scatter3DScene';

// Wrapper to fix React 19 types compatibility with Suspense
function SuspenseWrapper({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-demiurge-cyan text-xl mb-2 animate-pulse">
          INITIALIZING SCATTER3D ENGINE...
        </div>
        <div className="text-gray-500 text-sm">
          Loading render pipeline...
        </div>
      </div>
    </div>
  );
}

export default function Scatter3DPage() {
  return (
    <DemiurgeGate>
      <div className="fixed inset-0 bg-black">
        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 z-50 font-mono text-demiurge-cyan pointer-events-none">
          <div className="glass-panel p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">SCATTER3D // ENGINE v1.0.0</h2>
            <p className="text-xs text-gray-400 mb-1">Rendering Engine: ASCII_RASTER_V1</p>
            <p className="text-xs text-gray-400 mb-1">Mode: PHOTON_MAPPING</p>
            <p className="text-xs text-gray-400">Move mouse to rotate • Scroll to zoom</p>
          </div>
        </div>

        {/* 3D Canvas with ASCII Renderer */}
        <SuspenseWrapper fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [5, 5, 5], fov: 75 }}
            gl={{ antialias: false, alpha: false }}
            style={{ background: '#050505' }}
          >
            {/* ASCII Renderer - intercepts WebGL output */}
            <ScatterRenderer
              characters=" .:-+*=%@#"
              resolution={0.18}
              invert={true}
              color={true}
              backgroundColor="#050505"
              textColor="#00ff41"
            />

            {/* 3D Scene */}
            <Scatter3DScene />
          </Canvas>
        </SuspenseWrapper>
      </div>
    </DemiurgeGate>
  );
}
