'use client';

/**
 * HoloPanel
 * 
 * A floating holographic panel in 3D space.
 * Features glass effect, scanlines, and glow.
 */

import { useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { Group, Mesh, Color, ShaderMaterial } from 'three';
import { useWorldStore } from '@/world/WorldProvider';

// ============================================================================
// Hologram Shader
// ============================================================================

const hologramVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hologramFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uScanlineIntensity;
  uniform float uFlickerIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Random noise
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    // Base color with fresnel edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
    
    // Scanlines
    float scanline = sin(vUv.y * 100.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = pow(scanline, 8.0) * uScanlineIntensity;
    
    // Subtle flicker
    float flicker = random(vec2(uTime * 0.1, 0.0)) * uFlickerIntensity;
    
    // Combine
    vec3 color = uColor;
    float alpha = uOpacity * (0.3 + fresnel * 0.5 + scanline * 0.1);
    alpha *= (1.0 - flicker);
    
    // Edge glow
    alpha += fresnel * 0.3;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// HoloPanel Props
// ============================================================================

interface HoloPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  opacity?: number;
  lookAtCamera?: boolean;
  scanlines?: boolean;
  flicker?: boolean;
  glow?: boolean;
  children?: ReactNode;
  id?: string;
  onClick?: () => void;
}

// ============================================================================
// HoloPanel Component
// ============================================================================

export function HoloPanel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2,
  height = 1.5,
  depth = 0.02,
  color = '#FF6A00',
  opacity = 0.6,
  lookAtCamera = true,
  scanlines = true,
  flicker = true,
  glow = true,
  children,
  id,
  onClick,
}: HoloPanelProps) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  
  const isHovered = useWorldStore(
    (state) => id ? state.hoveredElement === id : false
  );
  const setHovered = useWorldStore((state) => state.setHoveredElement);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  const content = (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={isHovered ? 1.02 : 1}
      onPointerEnter={() => id && setHovered(id)}
      onPointerLeave={() => setHovered(null)}
      onClick={onClick}
    >
      {/* Main panel */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={hologramVertexShader}
          fragmentShader={hologramFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new Color(color) },
            uOpacity: { value: opacity },
            uScanlineIntensity: { value: scanlines ? 0.3 : 0 },
            uFlickerIntensity: { value: flicker ? 0.02 : 0 },
          }}
          transparent
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Border frame */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      
      {/* Edge lines */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
      
      {/* Corner accents */}
      {[
        [-width / 2, height / 2],
        [width / 2, height / 2],
        [-width / 2, -height / 2],
        [width / 2, -height / 2],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.002]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      
      {/* Glow plane behind */}
      {glow && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width + 0.2, height + 0.2]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isHovered ? 0.15 : 0.05}
          />
        </mesh>
      )}
      
      {/* Children content */}
      {children}
    </group>
  );
  
  if (lookAtCamera) {
    return <Billboard>{content}</Billboard>;
  }
  
  return content;
}

export default HoloPanel;
