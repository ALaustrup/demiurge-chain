'use client';

/**
 * Command Chamber
 * 
 * The central hub zone - replaces the traditional dashboard.
 * A hexagonal command center with holographic displays.
 */

import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float, Billboard } from '@react-three/drei';
import { Group, Mesh } from 'three';
import { useWorldStore } from '../WorldProvider';
import { useChainInfo } from '@/hooks/useChainData';
import { useBalance } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// Data Pillar Component
// ============================================================================

interface DataPillarProps {
  position: [number, number, number];
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  height?: number;
}

function DataPillar({
  position,
  label,
  value,
  subValue,
  color = '#FF6A00',
  height = 4,
}: DataPillarProps) {
  const pillarRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  
  const isHovered = useWorldStore(
    (state) => state.hoveredElement === `pillar-${label}`
  );
  const setHovered = useWorldStore((state) => state.setHoveredElement);
  
  useFrame((state) => {
    if (pillarRef.current) {
      // Subtle float animation
      pillarRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
    if (glowRef.current) {
      // Pulse glow
      const material = glowRef.current.material as any;
      if (material.opacity !== undefined) {
        material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });
  
  return (
    <group
      ref={pillarRef}
      position={position}
      onPointerEnter={() => setHovered(`pillar-${label}`)}
      onPointerLeave={() => setHovered(null)}
      scale={isHovered ? 1.05 : 1}
    >
      {/* Base glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Pillar beam */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.05, 0.05, height, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Top cap */}
      <mesh position={[0, height / 2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Label - always faces camera */}
      <Billboard position={[0, height / 2 + 0.5, 0]}>
        <Text
          fontSize={0.15}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Rajdhani-SemiBold.ttf"
          letterSpacing={0.1}
        >
          {label.toUpperCase()}
        </Text>
      </Billboard>
      
      {/* Value display */}
      <Billboard position={[0, height / 2 + 0.8, 0]}>
        <Text
          fontSize={0.3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="bottom"
          font="/fonts/JetBrainsMono-Regular.ttf"
        >
          {String(value)}
        </Text>
      </Billboard>
      
      {/* Sub value */}
      {subValue && (
        <Billboard position={[0, height / 2 + 1.2, 0]}>
          <Text
            fontSize={0.12}
            color="#7B8794"
            anchorX="center"
            anchorY="bottom"
          >
            {subValue}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

// ============================================================================
// Orbital Ring Component
// ============================================================================

function OrbitalRing() {
  const ringRef = useRef<Group>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <group ref={ringRef} position={[0, 3, 0]}>
      {/* Main ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#FF6A00" transparent opacity={0.6} />
      </mesh>
      
      {/* Secondary ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#CC5500" transparent opacity={0.3} />
      </mesh>
      
      {/* Orbital nodes (validators/blocks) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 5;
        const z = Math.sin(rad) * 5;
        
        return (
          <Float key={i} speed={2} floatIntensity={0.5}>
            <mesh position={[x, 0, z]}>
              <octahedronGeometry args={[0.1]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? '#FF6A00' : '#bf00ff'}
                transparent
                opacity={0.8}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

// ============================================================================
// Central Hologram
// ============================================================================

function CentralHologram() {
  const coreRef = useRef<Group>(null);
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  
  return (
    <group position={[0, 1.5, 0]}>
      {/* Rotating core */}
      <group ref={coreRef}>
        <mesh>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial color="#FF6A00" wireframe transparent opacity={0.6} />
        </mesh>
        
        <mesh scale={0.7}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#bf00ff" wireframe transparent opacity={0.4} />
        </mesh>
      </group>
      
      {/* Outer shell */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FF6A00" wireframe transparent opacity={0.1} />
      </mesh>
      
      {/* Energy field */}
      <Float speed={1.5} floatIntensity={0.2}>
        <mesh>
          <torusGeometry args={[0.6, 0.02, 16, 32]} />
          <meshBasicMaterial color="#FF6A00" transparent opacity={0.5} />
        </mesh>
      </Float>
    </group>
  );
}

// ============================================================================
// Zone Indicators
// ============================================================================

interface ZoneIndicatorProps {
  position: [number, number, number];
  label: string;
  color: string;
  onClick?: () => void;
}

function ZoneIndicator({ position, label, color, onClick }: ZoneIndicatorProps) {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });
  
  return (
    <group position={position} onClick={onClick}>
      {/* Direction marker */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.15, 0.3, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Label */}
      <Billboard position={[0, 1, 0]}>
        <Text
          fontSize={0.12}
          color={color}
          anchorX="center"
          font="/fonts/Rajdhani-SemiBold.ttf"
          letterSpacing={0.1}
        >
          {label.toUpperCase()}
        </Text>
      </Billboard>
      
      {/* Ground marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Command Chamber Main Component
// ============================================================================

function CommandChamberContent() {
  const { user } = useAuth();
  const chainInfo = useChainInfo();
  const walletAddress = user?.on_chain?.address || user?.on_chain_address;
  const balance = useBalance(walletAddress);
  const navigateToZone = useWorldStore((state) => state.setZone);
  
  // Format values
  const blockHeight = chainInfo.blockHeight?.toLocaleString() || '---';
  const validatorCount = chainInfo.validators || 0;
  const isConnected = chainInfo.isConnected;
  const cgtBalance = balance.data ? (Number(balance.data) / 1e18).toFixed(2) : '0.00';
  
  return (
    <group>
      {/* Central hologram */}
      <CentralHologram />
      
      {/* Orbital ring */}
      <OrbitalRing />
      
      {/* Data Pillars - positioned at cardinal directions */}
      <DataPillar
        position={[0, 0, -4]}
        label="Block Height"
        value={blockHeight}
        subValue={isConnected ? 'SYNCED' : 'OFFLINE'}
        color="#FF6A00"
        height={3.5}
      />
      
      <DataPillar
        position={[4, 0, 0]}
        label="CGT Balance"
        value={cgtBalance}
        subValue="AVAILABLE"
        color="#FFD700"
        height={3}
      />
      
      <DataPillar
        position={[0, 0, 4]}
        label="Validators"
        value={validatorCount}
        subValue="ACTIVE"
        color="#00ff88"
        height={3.5}
      />
      
      <DataPillar
        position={[-4, 0, 0]}
        label="Energy"
        value="100%"
        subValue="CHARGED"
        color="#bf00ff"
        height={3}
      />
      
      {/* Zone indicators at edges */}
      <ZoneIndicator
        position={[0, 0, -8]}
        label="Social Nexus"
        color="#bf00ff"
        onClick={() => navigateToZone('social')}
      />
      
      <ZoneIndicator
        position={[8, 0, 0]}
        label="Asset Vault"
        color="#FFD700"
        onClick={() => navigateToZone('assets')}
      />
      
      <ZoneIndicator
        position={[0, 0, 8]}
        label="Data Stream"
        color="#00ff88"
        onClick={() => navigateToZone('data')}
      />
      
      <ZoneIndicator
        position={[-8, 0, 0]}
        label="Experience"
        color="#ff6b6b"
        onClick={() => navigateToZone('experience')}
      />
    </group>
  );
}

export function CommandChamber() {
  return (
    <Suspense fallback={null}>
      <CommandChamberContent />
    </Suspense>
  );
}

export default CommandChamber;
