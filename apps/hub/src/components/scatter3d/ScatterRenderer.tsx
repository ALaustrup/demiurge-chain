'use client';

/**
 * Scatter3D Renderer Component
 * 
 * The core ASCII rendering engine that intercepts WebGL output
 * and converts it to colored text characters using Three.js AsciiEffect.
 * 
 * This implements the "Text-Based Photon Mapping System" - rendering
 * 3D geometry as ASCII characters with depth, lighting, and color.
 */

import { useEffect, useRef, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

interface ScatterRendererProps {
  /**
   * Character density string (light to dark)
   * Default: " .:-+*=%@#" (empty space to intense)
   */
  characters?: string;
  
  /**
   * Resolution factor (0.0 - 1.0)
   * Lower = blockier/faster, Higher = sharper/slower
   * Default: 0.18
   */
  resolution?: number;
  
  /**
   * Invert colors
   * Default: true (dark background, light text)
   */
  invert?: boolean;
  
  /**
   * Enable color (text inherits material color)
   * Default: true
   */
  color?: boolean;
  
  /**
   * Background color (CSS color string)
   * Default: '#050505' (deep black)
   */
  backgroundColor?: string;
  
  /**
   * Text color (CSS color string, used when color=false)
   * Default: '#00ff41' (hacker green)
   */
  textColor?: string;
}

export default function ScatterRenderer({
  characters = " .:-+*=%@#",
  resolution = 0.18,
  invert = true,
  color = true,
  backgroundColor = '#050505',
  textColor = '#00ff41',
}: ScatterRendererProps) {
  const { gl, scene, camera, size } = useThree();
  const effectRef = useRef<AsciiEffect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize the ASCII Effect
  useLayoutEffect(() => {
    if (!gl || !containerRef.current) return;

    // Create the ASCII Effect
    const effect = new AsciiEffect(gl, characters, {
      invert,
      color,
      resolution,
    });

    // Style the text DOM overlay
    const domElement = effect.domElement;
    domElement.style.position = 'absolute';
    domElement.style.top = '0';
    domElement.style.left = '0';
    domElement.style.width = '100%';
    domElement.style.height = '100%';
    domElement.style.pointerEvents = 'none'; // Click-through to 3D scene
    domElement.style.color = textColor;
    domElement.style.backgroundColor = backgroundColor;
    domElement.style.fontFamily = 'monospace';
    domElement.style.fontSize = '14px';
    domElement.style.lineHeight = '1';
    domElement.style.overflow = 'hidden';

    // Mount to DOM
    containerRef.current.appendChild(domElement);
    effectRef.current = effect;

    // Cleanup
    return () => {
      if (containerRef.current && domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(domElement);
      }
      effectRef.current = null;
    };
  }, [gl, characters, invert, color, resolution, textColor, backgroundColor]);

  // Handle window resize
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  // Render loop (runs every frame)
  useFrame(() => {
    if (effectRef.current) {
      effectRef.current.render(scene, camera);
    }
  });

  // Return container that sits on top of the canvas
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  );
}
