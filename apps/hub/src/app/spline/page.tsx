'use client';

/**
 * Spline Demo Page
 * 
 * Test and configure Spline 3D scenes.
 * Replace SCENE_URL with your exported Spline scene URL.
 */

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SplineScene, SplineSceneRef } from '@/components/spline';
import type { Application } from '@splinetool/runtime';

// ============================================================================
// Configuration
// ============================================================================

// Replace this with your Spline scene URL from Export > Code > React
const SCENE_URL = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL || '';

// No demo scene - user must provide their own
const DEMO_SCENE = '';

// ============================================================================
// Page Component
// ============================================================================

export default function SplineDemoPage() {
  const splineRef = useRef<SplineSceneRef>(null);
  const initialUrl = SCENE_URL || DEMO_SCENE || '';
  const [sceneUrl, setSceneUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState('');
  const [splineApp, setSplineApp] = useState<Application | null>(null);
  const [objects, setObjects] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [lastEvent, setLastEvent] = useState<string>('');
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  // Handle scene load
  const handleLoad = useCallback((spline: Application) => {
    setSplineApp(spline);
    
    // Get all objects
    const allObjects = spline.getAllObjects();
    const objectNames = allObjects.map(obj => obj.name).filter(Boolean);
    setObjects(objectNames);
    
    // Get all variables
    const vars = spline.getVariables();
    setVariables(vars || {});
    
    console.log('Scene loaded!');
    console.log('Objects:', objectNames);
    console.log('Variables:', vars);
  }, []);

  // Handle events
  const handleMouseHover = useCallback((e: any) => {
    setHoveredObject(e.target?.name || null);
    setLastEvent(`Hover: ${e.target?.name || 'unknown'}`);
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    setLastEvent(`Click: ${e.target?.name || 'unknown'}`);
  }, []);

  // Load new scene
  const loadScene = () => {
    if (inputUrl && inputUrl !== sceneUrl) {
      setSceneUrl(inputUrl);
      setObjects([]);
      setVariables({});
    }
  };

  // Test API functions
  const testRotate = () => {
    if (objects.length > 0) {
      const randomRotation = Math.random() * 360;
      splineRef.current?.setRotation(objects[0], 0, randomRotation, 0);
    }
  };

  const testScale = () => {
    if (objects.length > 0) {
      const scale = 0.5 + Math.random() * 1.5;
      splineRef.current?.setScale(objects[0], scale, scale, scale);
    }
  };

  const testEmit = () => {
    // Emit a generic event - customize based on your scene
    splineRef.current?.emitEvent('mouseDown');
  };

  return (
    <div className="min-h-screen bg-architect-bg">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-architect-bg/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl tracking-wider text-neon-cyan">
                SPLINE INTEGRATION
              </h1>
              <p className="text-sm text-text-tertiary mt-1">
                Test and configure your 3D scenes
              </p>
            </div>
            
            {/* Scene URL input */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste Spline scene URL..."
                className="w-96 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/50"
              />
              <button
                onClick={loadScene}
                className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-sm text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
              >
                Load Scene
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-20 flex h-screen">
        {/* Scene viewer */}
        <div className="flex-1 relative">
          {sceneUrl ? (
            <SplineScene
              ref={splineRef}
              scene={sceneUrl}
              onLoad={handleLoad}
              onMouseHover={handleMouseHover}
              onMouseDown={handleMouseDown}
              debug
              className="w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-architect-bg">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="font-display text-xl text-text-primary mb-2">No Scene Loaded</h2>
                <p className="text-sm text-text-tertiary mb-6">
                  Export your Spline scene as React code and paste the URL above
                </p>
                <div className="text-left bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-text-secondary font-mono mb-2">Example URL format:</p>
                  <code className="text-xs text-neon-cyan break-all">
                    https://prod.spline.design/xxxxx/scene.splinecode
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Hover indicator */}
          {hoveredObject && (
            <div className="absolute bottom-6 left-6 px-4 py-2 bg-architect-bg/90 border border-neon-cyan/30 rounded-lg">
              <span className="text-sm text-neon-cyan font-mono">
                Hovering: {hoveredObject}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-architect-card border-l border-white/5 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <h3 className="font-display text-sm tracking-wider text-text-secondary uppercase mb-3">
                Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${splineApp ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <span className="text-sm text-text-primary">
                    {splineApp ? 'Scene Loaded' : 'Loading...'}
                  </span>
                </div>
                {lastEvent && (
                  <p className="text-xs text-text-tertiary font-mono">
                    Last: {lastEvent}
                  </p>
                )}
              </div>
            </div>

            {/* Objects */}
            <div>
              <h3 className="font-display text-sm tracking-wider text-text-secondary uppercase mb-3">
                Objects ({objects.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {objects.map((name) => (
                  <div
                    key={name}
                    className={`px-3 py-1.5 rounded text-xs font-mono ${
                      hoveredObject === name
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'text-text-secondary hover:bg-white/5'
                    }`}
                  >
                    {name}
                  </div>
                ))}
                {objects.length === 0 && (
                  <p className="text-xs text-text-tertiary">No objects found</p>
                )}
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-display text-sm tracking-wider text-text-secondary uppercase mb-3">
                Variables
              </h3>
              <div className="space-y-2">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-mono">{key}</span>
                    <span className="text-neon-cyan font-mono">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(variables).length === 0 && (
                  <p className="text-xs text-text-tertiary">No variables defined</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div>
              <h3 className="font-display text-sm tracking-wider text-text-secondary uppercase mb-3">
                Test Controls
              </h3>
              <div className="space-y-2">
                <button
                  onClick={testRotate}
                  disabled={objects.length === 0}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Rotate First Object
                </button>
                <button
                  onClick={testScale}
                  disabled={objects.length === 0}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Random Scale
                </button>
                <button
                  onClick={testEmit}
                  disabled={!splineApp}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-text-primary hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Emit Event
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
              <h4 className="text-sm font-display text-neon-cyan mb-2">How to Use</h4>
              <ol className="text-xs text-text-tertiary space-y-1 list-decimal list-inside">
                <li>Open Spline and design your scene</li>
                <li>Click Export &gt; Code &gt; React</li>
                <li>Copy the scene URL</li>
                <li>Paste it above and click Load</li>
                <li>Interact with your scene!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
