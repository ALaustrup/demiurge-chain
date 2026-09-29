'use client';

/**
 * World Particles
 * 
 * Ambient particle systems for the immersive environment.
 * Creates floating data particles and energy streams.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { Points as ThreePoints, BufferGeometry, Float32BufferAttribute, Color, AdditiveBlending } from 'three';
import { useWorldStore } from '../WorldProvider';

// ============================================================================
// Floating Particles
// ============================================================================

interface FloatingParticlesProps {
  count?: number;
  radius?: number;
  size?: number;
  color?: string;
  speed?: number;
}

function FloatingParticles({
  count = 500,
  radius = 15,
  size = 0.02,
  color = '#FF6A00',
  speed = 0.1,
}: FloatingParticlesProps) {
  const pointsRef = useRef<ThreePoints>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * radius;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10; // Vertical spread
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, [count, radius]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Gentle floating motion
      posArray[i3 + 1] += Math.sin(time * speed + i * 0.1) * 0.002;
      
      // Slow drift
      posArray[i3] += Math.sin(time * speed * 0.5 + i * 0.05) * 0.001;
      posArray[i3 + 2] += Math.cos(time * speed * 0.5 + i * 0.05) * 0.001;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.02;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.6}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// Data Stream Particles
// ============================================================================

interface DataStreamProps {
  startPos?: [number, number, number];
  endPos?: [number, number, number];
  count?: number;
  speed?: number;
  color?: string;
}

function DataStream({
  startPos = [0, 0, 0],
  endPos = [0, 5, 0],
  count = 50,
  speed = 1,
  color = '#FF6A00',
}: DataStreamProps) {
  const pointsRef = useRef<ThreePoints>(null);
  
  const { positions, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      offs[i] = i / count;
      
      // Initialize along the path
      const t = offs[i];
      pos[i * 3] = startPos[0] + (endPos[0] - startPos[0]) * t + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = startPos[1] + (endPos[1] - startPos[1]) * t;
      pos[i * 3 + 2] = startPos[2] + (endPos[2] - startPos[2]) * t + (Math.random() - 0.5) * 0.2;
    }
    
    return { positions: pos, offsets: offs };
  }, [count, startPos, endPos]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = ((offsets[i] + time * speed * 0.1) % 1);
      
      posArray[i3] = startPos[0] + (endPos[0] - startPos[0]) * t + Math.sin(t * Math.PI * 4) * 0.1;
      posArray[i3 + 1] = startPos[1] + (endPos[1] - startPos[1]) * t;
      posArray[i3 + 2] = startPos[2] + (endPos[2] - startPos[2]) * t + Math.cos(t * Math.PI * 4) * 0.1;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// World Particles (Main Export)
// ============================================================================

export function WorldParticles() {
  const reducedMotion = useWorldStore((state) => state.reducedMotion);
  
  if (reducedMotion) {
    // Simplified particles for reduced motion
    return <FloatingParticles count={100} speed={0.02} />;
  }
  
  return (
    <group>
      {/* Ambient floating particles */}
      <FloatingParticles count={800} radius={20} size={0.015} color="#FF6A00" speed={0.1} />
      <FloatingParticles count={400} radius={15} size={0.02} color="#CC5500" speed={0.15} />
      <FloatingParticles count={200} radius={10} size={0.025} color="#bf00ff" speed={0.08} />
      
      {/* Data streams - vertical pillars */}
      <DataStream startPos={[-5, 0, -5]} endPos={[-5, 8, -5]} count={30} color="#FF6A00" />
      <DataStream startPos={[5, 0, -5]} endPos={[5, 8, -5]} count={30} color="#CC5500" />
      <DataStream startPos={[-5, 0, 5]} endPos={[-5, 8, 5]} count={30} color="#bf00ff" />
      <DataStream startPos={[5, 0, 5]} endPos={[5, 8, 5]} count={30} color="#FF6A00" />
      
      {/* Central upward stream */}
      <DataStream startPos={[0, 0, 0]} endPos={[0, 12, 0]} count={60} speed={1.5} color="#FF6A00" />
    </group>
  );
}

export default WorldParticles;
