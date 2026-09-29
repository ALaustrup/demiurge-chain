'use client';

/**
 * Hexagonal Floor
 * 
 * The central platform of the Command Chamber.
 * Features glowing grid lines and hexagonal pattern.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, Color, DoubleSide } from 'three';
import { useWorldStore } from '../WorldProvider';

// ============================================================================
// Hexagonal Grid Shader
// ============================================================================

const hexGridVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hexGridFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Hexagonal distance function
  float hexDistance(vec2 p) {
    p = abs(p);
    float c = dot(p, normalize(vec2(1.0, 1.73)));
    return max(c, p.x);
  }
  
  // Create hexagonal grid
  vec4 hexGrid(vec2 uv, float scale) {
    vec2 r = vec2(1.0, 1.73);
    vec2 h = r * 0.5;
    vec2 a = mod(uv * scale, r) - h;
    vec2 b = mod(uv * scale - h, r) - h;
    
    vec2 gv = length(a) < length(b) ? a : b;
    
    float edge = 0.02;
    float hex = smoothstep(0.0, edge, 0.5 - hexDistance(gv));
    
    float line = 1.0 - smoothstep(0.0, edge, abs(hexDistance(gv) - 0.5));
    
    return vec4(gv, hex, line);
  }
  
  void main() {
    vec2 uv = vPosition.xz * 0.1;
    
    // Multiple hex layers for depth
    vec4 hex1 = hexGrid(uv, 3.0);
    vec4 hex2 = hexGrid(uv, 6.0);
    
    // Combine layers
    float pattern = hex1.w * 0.6 + hex2.w * 0.3;
    
    // Radial fade
    float dist = length(vPosition.xz);
    float radialFade = 1.0 - smoothstep(5.0, 15.0, dist);
    
    // Pulse effect
    float pulse = sin(uTime * 0.5 - dist * 0.3) * 0.5 + 0.5;
    
    // Color mixing
    vec3 color = mix(uSecondaryColor, uColor, pulse * 0.5 + 0.5);
    
    // Final color
    float alpha = pattern * radialFade * uOpacity * (0.3 + pulse * 0.2);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Floor Component
// ============================================================================

export function HexagonalFloor() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  
  const currentZone = useWorldStore((state) => state.currentZone);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color('#FF6A00') },
    uSecondaryColor: { value: new Color('#CC5500') },
    uOpacity: { value: 1.0 },
  }), []);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <group>
      {/* Main floor plane with hex shader */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={hexGridVertexShader}
          fragmentShader={hexGridFragmentShader}
          uniforms={uniforms}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Solid base floor (catches shadows) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#0B0C10"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Center platform ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <ringGeometry args={[4, 4.1, 64]} />
        <meshBasicMaterial color="#FF6A00" transparent opacity={0.8} />
      </mesh>
      
      {/* Inner accent ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <ringGeometry args={[2, 2.05, 64]} />
        <meshBasicMaterial color="#CC5500" transparent opacity={0.6} />
      </mesh>
      
      {/* Hexagonal border markers */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 6;
        const z = Math.sin(rad) * 6;
        
        return (
          <mesh
            key={i}
            position={[x, 0.02, z]}
            rotation={[-Math.PI / 2, 0, rad]}
          >
            <circleGeometry args={[0.15, 6]} />
            <meshBasicMaterial color="#FF6A00" transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

export default HexagonalFloor;
