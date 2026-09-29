'use client';

/**
 * Scatter3D Demo Scene
 * 
 * A demonstration 3D world rendered entirely in ASCII characters.
 * Features:
 * - Rotating Torus Knot (The "Core")
 * - Grid floor plane
 * - Floating data cubes
 * - Mouse-controlled camera (OrbitControls)
 * - Dynamic lighting
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

function RotatingCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 2, 0]}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshStandardMaterial
        color="#00ff41"
        emissive="#00ff41"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function FloatingCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  );
}

function MovingLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.elapsedTime;
      lightRef.current.position.x = Math.cos(time * 0.5) * 5;
      lightRef.current.position.z = Math.sin(time * 0.5) * 5;
      lightRef.current.position.y = 3 + Math.sin(time * 0.3) * 2;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={1}
      color="#ff00ff"
      distance={20}
      decay={2}
    />
  );
}

export function Scatter3DScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <MovingLight />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00ffff" />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        autoRotate={false}
      />

      {/* Grid Floor */}
      <Grid
        args={[20, 20]}
        cellColor="#00ff41"
        sectionColor="#00ff88"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={15}
        fadeStrength={1}
      />

      {/* The Core - Rotating Torus Knot */}
      <RotatingCore />

      {/* Floating Data Cubes */}
      <FloatingCube position={[-3, 1, -2]} color="#ff00ff" />
      <FloatingCube position={[3, 1.5, -2]} color="#00ffff" />
      <FloatingCube position={[-2, 0.8, 3]} color="#ffff00" />
      <FloatingCube position={[2, 1.2, 3]} color="#ff0088" />
      <FloatingCube position={[0, 0.5, -4]} color="#00ff88" />
    </>
  );
}
