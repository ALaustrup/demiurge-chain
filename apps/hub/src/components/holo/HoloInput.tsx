'use client';

/**
 * HoloInput
 * 
 * Text input field in 3D space.
 * Uses HTML overlay for actual input functionality.
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Html } from '@react-three/drei';
import { Group } from 'three';

// ============================================================================
// Types
// ============================================================================

interface HoloInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  position?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  type?: 'text' | 'number' | 'password';
  disabled?: boolean;
}

// ============================================================================
// HoloInput Component
// ============================================================================

export function HoloInput({
  value,
  onChange,
  placeholder = '',
  position = [0, 0, 0],
  width = 2,
  height = 0.4,
  color = '#FF6A00',
  label,
  type = 'text',
  disabled = false,
}: HoloInputProps) {
  const groupRef = useRef<Group>(null);
  const [focused, setFocused] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current && focused) {
      // Subtle pulse when focused
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.02;
      groupRef.current.scale.setScalar(1 + pulse);
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Label */}
      {label && (
        <Billboard position={[0, height / 2 + 0.15, 0]}>
          <Text
            fontSize={0.1}
            color="#7B8794"
            anchorX="center"
            anchorY="bottom"
            font="/fonts/Rajdhani-SemiBold.ttf"
            letterSpacing={0.1}
          >
            {label.toUpperCase()}
          </Text>
        </Billboard>
      )}
      
      {/* Background */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color="#0B0C10"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <meshBasicMaterial
          color={focused ? color : '#CC5500'}
          transparent
          opacity={0.6}
          wireframe
        />
      </mesh>
      
      {/* Focus glow */}
      {focused && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width + 0.1, height + 0.1]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}
      
      {/* Input via HTML overlay */}
      <Html
        position={[0, 0, 0.01]}
        center
        distanceFactor={3}
        style={{
          width: `${width * 100}px`,
          pointerEvents: 'auto',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        />
      </Html>
      
      {/* Corner accents */}
      {[
        [-width / 2, height / 2],
        [width / 2, height / 2],
        [-width / 2, -height / 2],
        [width / 2, -height / 2],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.002]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

export default HoloInput;
