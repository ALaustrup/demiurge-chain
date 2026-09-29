'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// STARFIELD BACKGROUND - Dark-Mode Ethereal Glassmorphism
// Volumetric depth with sacred geometry wireframes
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE FIELD - Deep space starfield with depth
// ─────────────────────────────────────────────────────────────────────────────

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  
  const particleCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Distribute in a sphere for depth
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 40;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      // Very slow rotation for depth feel
      ref.current.rotation.y = state.clock.elapsedTime * 0.005;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#FFFFFF"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CYAN DATA NODES - Brighter accent points
// ─────────────────────────────────────────────────────────────────────────────

function DataNodes() {
  const ref = useRef<THREE.Points>(null);
  
  const nodeCount = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.008;
      // Pulsing scale effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00E5FF"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SACRED GEOMETRY - Wireframe hexagonal grid
// ─────────────────────────────────────────────────────────────────────────────

function SacredGeometryGrid() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate hexagonal grid points
  const gridLines = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    const gridSize = 8;
    const spacing = 5;
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const offsetX = (z % 2) * (spacing / 2);
        const px = x * spacing + offsetX;
        const pz = z * spacing * 0.866; // hex ratio
        
        // Horizontal lines
        if (x < gridSize) {
          const nextOffsetX = (z % 2) * (spacing / 2);
          lines.push([
            new THREE.Vector3(px, 0, pz),
            new THREE.Vector3((x + 1) * spacing + nextOffsetX, 0, pz)
          ]);
        }
        
        // Diagonal lines
        if (z < gridSize) {
          const nextZ = z + 1;
          const nextOffsetX = (nextZ % 2) * (spacing / 2);
          const nextPz = nextZ * spacing * 0.866;
          
          lines.push([
            new THREE.Vector3(px, 0, pz),
            new THREE.Vector3(x * spacing + nextOffsetX, 0, nextPz)
          ]);
        }
      }
    }
    
    return lines;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle wave animation
      groupRef.current.position.y = -15 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
      groupRef.current.rotation.x = -Math.PI / 2.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -15, -10]}>
      {gridLines.map((line, i) => (
        <Line
          key={i}
          points={line}
          color="#00E5FF"
          lineWidth={0.5}
          transparent
          opacity={0.06}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPOGRAPHICAL RINGS - Concentric geometry
// ─────────────────────────────────────────────────────────────────────────────

function TopographicalRings() {
  const groupRef = useRef<THREE.Group>(null);
  
  const rings = useMemo(() => {
    const ringData: { radius: number; segments: number }[] = [];
    for (let i = 1; i <= 6; i++) {
      ringData.push({ radius: i * 8, segments: 64 });
    }
    return ringData;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, -20, -30]} rotation={[-Math.PI / 2.2, 0, 0]}>
      {rings.map((ring, i) => {
        const points: THREE.Vector3[] = [];
        for (let j = 0; j <= ring.segments; j++) {
          const angle = (j / ring.segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
            Math.cos(angle) * ring.radius,
            Math.sin(angle) * ring.radius,
            0
          ));
        }
        return (
          <Line
            key={i}
            points={points}
            color="#00E5FF"
            lineWidth={0.5}
            transparent
            opacity={0.03 + (i * 0.01)}
          />
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLUMETRIC FOG - Depth atmosphere
// ─────────────────────────────────────────────────────────────────────────────

function VolumetricFog() {
  const ref = useRef<THREE.Points>(null);
  
  const fogCount = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(fogCount * 3);
    for (let i = 0; i < fogCount; i++) {
      // Concentrate fog in horizontal bands
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.003;
      // Breathing effect
      const opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      (ref.current.material as THREE.PointsMaterial).opacity = opacity;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#9D4EDD"
        size={0.4}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA PARALLAX - Mouse-reactive depth
// ─────────────────────────────────────────────────────────────────────────────

function CameraParallax() {
  const { camera } = useThree();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useFrame(() => {
    // Subtle camera movement based on mouse
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 2, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouse.y * 1, 0.02);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCENE
// ─────────────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      {/* Very dim ambient */}
      <ambientLight intensity={0.02} />
      
      {/* Main starfield */}
      <ParticleField />
      
      {/* Accent data nodes */}
      <DataNodes />
      
      {/* Sacred geometry grid */}
      <SacredGeometryGrid />
      
      {/* Topographical rings */}
      <TopographicalRings />
      
      {/* Volumetric fog */}
      <VolumetricFog />
      
      {/* Mouse parallax */}
      <CameraParallax />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function StarfieldBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Base void gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(0, 229, 255, 0.03) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 80%, rgba(157, 78, 221, 0.02) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, #0a0a0b 0%, #050505 100%)
          `,
        }}
      />
      
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 25], fov: 55 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5, 5, 5, 0.9) 100%)',
        }}
      />
      
      {/* Noise texture overlay */}
      <div className="noise-overlay" />
      
      {/* Scan line effect */}
      <div className="scan-overlay" />
    </div>
  );
}

export default StarfieldBackground;
