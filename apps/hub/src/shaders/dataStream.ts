/**
 * Data Stream Shader
 * 
 * Flowing data visualization effect for particles and lines.
 */

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color } from 'three';

// ============================================================================
// Shader Code
// ============================================================================

export const dataStreamVertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  
  attribute float aOffset;
  
  varying float vAlpha;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    // Calculate position along stream
    float t = mod(aOffset + uTime * uSpeed, 1.0);
    
    // Fade in/out at ends
    vAlpha = sin(t * 3.14159);
    
    // Apply position
    vec3 pos = position;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 4.0 * vAlpha;
  }
`;

export const dataStreamFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  varying float vAlpha;
  varying vec2 vUv;
  
  void main() {
    // Circular point
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Glow
    float glow = exp(-dist * 3.0) * 0.5;
    
    vec3 color = uColor * (1.0 + glow);
    float finalAlpha = alpha * vAlpha * uOpacity + glow * vAlpha * 0.3;
    
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

// ============================================================================
// Line Stream Shader
// ============================================================================

export const lineStreamVertexShader = `
  uniform float uTime;
  
  varying vec2 vUv;
  varying float vFlow;
  
  void main() {
    vUv = uv;
    vFlow = mod(uv.x - uTime * 0.5, 1.0);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const lineStreamFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying float vFlow;
  
  void main() {
    // Flowing gradient
    float alpha = sin(vFlow * 3.14159);
    
    // Pulse effect
    float pulse = sin(vFlow * 6.28318 * 3.0) * 0.3 + 0.7;
    
    vec3 color = uColor * pulse;
    
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;

// ============================================================================
// Material Factory
// ============================================================================

export const DataStreamMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color('#FF6A00'),
    uOpacity: 0.8,
    uSpeed: 1.0,
  },
  dataStreamVertexShader,
  dataStreamFragmentShader
);

export const LineStreamMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color('#FF6A00'),
    uOpacity: 0.6,
  },
  lineStreamVertexShader,
  lineStreamFragmentShader
);

extend({ DataStreamMaterial, LineStreamMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dataStreamMaterial: any;
      lineStreamMaterial: any;
    }
  }
}

export default DataStreamMaterial;
