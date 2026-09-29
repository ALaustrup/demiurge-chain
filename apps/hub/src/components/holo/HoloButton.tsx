'use client';

/**
 * HoloButton
 * 
 * Interactive button in 3D space with holographic effects.
 */

import { useRef, useState, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, useCursor } from '@react-three/drei';
import { Group, Mesh, Color } from 'three';

// ============================================================================
// Types
// ============================================================================

interface HoloButtonProps {
  children: ReactNode;
  position?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  hoverColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  lookAtCamera?: boolean;
}

// ============================================================================
// Size Mappings
// ============================================================================

const SIZES = {
  sm: { width: 0.8, height: 0.25, fontSize: 0.08 },
  md: { width: 1.2, height: 0.35, fontSize: 0.1 },
  lg: { width: 1.6, height: 0.45, fontSize: 0.12 },
};

// ============================================================================
// HoloButton Component
// ============================================================================

export function HoloButton({
  children,
  position = [0, 0, 0],
  width,
  height,
  color = '#FF6A00',
  hoverColor = '#FF8C33',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  lookAtCamera = true,
}: HoloButtonProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  
  // Change cursor on hover
  useCursor(hovered && !disabled);
  
  // Get dimensions
  const dimensions = SIZES[size];
  const w = width ?? dimensions.width;
  const h = height ?? dimensions.height;
  
  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      // Scale on hover
      const targetScale = pressed ? 0.95 : hovered && !disabled ? 1.05 : 1;
      groupRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.2
      );
    }
    
    if (glowRef.current) {
      // Glow pulse
      const material = glowRef.current.material as any;
      if (material.opacity !== undefined) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.1;
        material.opacity = hovered && !disabled ? 0.3 + pulse : 0.1;
      }
    }
  });
  
  // Get colors based on variant
  const getColors = () => {
    if (disabled) {
      return { bg: '#333333', text: '#666666', border: '#444444' };
    }
    
    switch (variant) {
      case 'primary':
        return {
          bg: hovered ? hoverColor : color,
          text: '#0B0C10',
          border: color,
        };
      case 'secondary':
        return {
          bg: 'transparent',
          text: hovered ? hoverColor : color,
          border: hovered ? hoverColor : color,
        };
      case 'ghost':
        return {
          bg: hovered ? color : 'transparent',
          text: hovered ? '#0B0C10' : color,
          border: 'transparent',
        };
      default:
        return { bg: color, text: '#0B0C10', border: color };
    }
  };
  
  const colors = getColors();
  
  const content = (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={() => !disabled && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        if (!disabled && onClick) onClick();
      }}
    >
      {/* Background */}
      {variant !== 'ghost' && (
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            color={colors.bg === 'transparent' ? '#000000' : colors.bg}
            transparent
            opacity={colors.bg === 'transparent' ? 0 : variant === 'primary' ? 0.9 : 0.1}
          />
        </mesh>
      )}
      
      {/* Border */}
      {variant !== 'ghost' && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[w + 0.02, h + 0.02]} />
          <meshBasicMaterial
            color={colors.border}
            transparent
            opacity={0.8}
            wireframe
          />
        </mesh>
      )}
      
      {/* Glow */}
      <mesh ref={glowRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[w + 0.1, h + 0.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      
      {/* Corner accents */}
      {[
        [-w / 2, h / 2],
        [w / 2, h / 2],
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.002]}>
          <planeGeometry args={[0.03, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      
      {/* Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={dimensions.fontSize}
        color={colors.text}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Rajdhani-SemiBold.ttf"
        letterSpacing={0.1}
      >
        {String(children).toUpperCase()}
      </Text>
    </group>
  );
  
  if (lookAtCamera) {
    return <Billboard>{content}</Billboard>;
  }
  
  return content;
}

export default HoloButton;
