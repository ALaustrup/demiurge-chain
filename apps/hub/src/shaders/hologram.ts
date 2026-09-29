/**
 * Hologram Shader
 * 
 * Main holographic material with scanlines, flicker, and edge glow.
 */

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, ShaderMaterial } from 'three';

// ============================================================================
// Shader Code
// ============================================================================

export const hologramVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hologramFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uScanlineIntensity;
  uniform float uScanlineCount;
  uniform float uFlickerIntensity;
  uniform float uGlitchIntensity;
  uniform float uFresnelPower;
  uniform float uRimIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  // Pseudo-random
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }
  
  float noise(float p) {
    float fl = floor(p);
    float fc = fract(p);
    return mix(hash(fl), hash(fl + 1.0), fc);
  }
  
  // Scanline effect
  float scanline(float uv, float time, float count) {
    float scan = sin(uv * count + time * 2.0) * 0.5 + 0.5;
    return pow(scan, 8.0);
  }
  
  // Glitch effect
  float glitch(vec2 uv, float time, float intensity) {
    float glitchLine = step(0.99, sin(uv.y * 100.0 + time * 50.0));
    float glitchNoise = hash(floor(time * 20.0)) * step(0.98, hash(floor(uv.y * 50.0 + time)));
    return (glitchLine + glitchNoise) * intensity;
  }
  
  void main() {
    // View direction for fresnel
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), uFresnelPower);
    
    // Scanlines
    float scan = scanline(vUv.y, uTime, uScanlineCount) * uScanlineIntensity;
    
    // Horizontal scanlines (less visible)
    float scanH = scanline(vUv.x, uTime * 0.5, uScanlineCount * 0.3) * uScanlineIntensity * 0.3;
    
    // Flicker
    float flicker = noise(uTime * 10.0) * uFlickerIntensity;
    
    // Glitch
    float glitchEffect = glitch(vUv, uTime, uGlitchIntensity);
    
    // Rim lighting
    float rim = fresnel * uRimIntensity;
    
    // Combine alpha
    float alpha = uOpacity;
    alpha += scan * 0.2;
    alpha += scanH * 0.1;
    alpha -= flicker;
    alpha += rim * 0.3;
    alpha += glitchEffect;
    
    // Edge glow
    float edgeGlow = fresnel * 0.5;
    
    // Final color
    vec3 finalColor = uColor * (1.0 + edgeGlow);
    
    // Chromatic aberration hint
    vec3 aberration = vec3(
      uColor.r * (1.0 + fresnel * 0.1),
      uColor.g,
      uColor.b * (1.0 - fresnel * 0.1)
    );
    finalColor = mix(finalColor, aberration, fresnel * 0.3);
    
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
  }
`;

// ============================================================================
// Material Factory
// ============================================================================

export const HologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color('#FF6A00'),
    uOpacity: 0.6,
    uScanlineIntensity: 0.3,
    uScanlineCount: 100,
    uFlickerIntensity: 0.02,
    uGlitchIntensity: 0.0,
    uFresnelPower: 2.0,
    uRimIntensity: 1.0,
  },
  hologramVertexShader,
  hologramFragmentShader
);

// Extend Three.js with our custom material
extend({ HologramMaterial });

// ============================================================================
// Type Declaration
// ============================================================================

declare global {
  namespace JSX {
    interface IntrinsicElements {
      hologramMaterial: any;
    }
  }
}

export default HologramMaterial;
