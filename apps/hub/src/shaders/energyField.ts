/**
 * Energy Field Shader
 * 
 * Glowing energy/force field effect for UI elements and environmental objects.
 */

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color } from 'three';

// ============================================================================
// Shader Code
// ============================================================================

export const energyFieldVertexShader = `
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

export const energyFieldFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform float uOpacity;
  uniform float uPulseSpeed;
  uniform float uNoiseScale;
  uniform float uEdgeIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    // Animated noise pattern
    float noise1 = snoise(vUv * uNoiseScale + uTime * 0.3);
    float noise2 = snoise(vUv * uNoiseScale * 2.0 - uTime * 0.2);
    float combinedNoise = (noise1 + noise2 * 0.5) * 0.5 + 0.5;
    
    // Pulse effect
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    
    // Edge detection for rim glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float edge = 1.0 - abs(dot(viewDir, vNormal));
    edge = pow(edge, 2.0) * uEdgeIntensity;
    
    // Color mixing
    vec3 color = mix(uSecondaryColor, uColor, combinedNoise * pulse);
    color += uColor * edge;
    
    // Alpha
    float alpha = uOpacity * (0.2 + combinedNoise * 0.3 + edge * 0.5);
    alpha *= 0.8 + pulse * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Material Factory
// ============================================================================

export const EnergyFieldMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color('#FF6A00'),
    uSecondaryColor: new Color('#bf00ff'),
    uOpacity: 0.5,
    uPulseSpeed: 1.0,
    uNoiseScale: 3.0,
    uEdgeIntensity: 1.5,
  },
  energyFieldVertexShader,
  energyFieldFragmentShader
);

extend({ EnergyFieldMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      energyFieldMaterial: any;
    }
  }
}

export default EnergyFieldMaterial;
