'use client';

/**
 * Environment Lighting
 * 
 * Immersive lighting setup for the Command Chamber
 * with volumetric effects and dynamic accent lights.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight, PointLight, DirectionalLight, Group } from 'three';
import { useWorldStore, ZONES } from '../WorldProvider';

export function EnvironmentLighting() {
  const currentZone = useWorldStore((state) => state.currentZone);
  const zone = ZONES[currentZone];
  
  const spotLightRef = useRef<SpotLight>(null);
  const accentLight1Ref = useRef<PointLight>(null);
  const accentLight2Ref = useRef<PointLight>(null);
  
  // Subtle light animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Breathing effect on accent lights
    if (accentLight1Ref.current) {
      accentLight1Ref.current.intensity = 1.5 + Math.sin(time * 0.5) * 0.3;
    }
    if (accentLight2Ref.current) {
      accentLight2Ref.current.intensity = 1.5 + Math.sin(time * 0.5 + Math.PI) * 0.3;
    }
  });
  
  return (
    <group>
      {/* Ambient base light */}
      <ambientLight intensity={0.15} color="#1F2833" />
      
      {/* Main overhead spotlight - "god ray" effect */}
      <spotLight
        ref={spotLightRef}
        position={[0, 15, 0]}
        angle={0.4}
        penumbra={0.8}
        intensity={2}
        color="#FF6A00"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      
      {/* Secondary fill light */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.3}
        color="#CC5500"
      />
      
      {/* Accent point lights - cyan glow */}
      <pointLight
        ref={accentLight1Ref}
        position={[-5, 2, -5]}
        intensity={1.5}
        color="#FF6A00"
        distance={15}
        decay={2}
      />
      
      {/* Accent point lights - secondary color */}
      <pointLight
        ref={accentLight2Ref}
        position={[5, 2, -5]}
        intensity={1.5}
        color="#CC5500"
        distance={15}
        decay={2}
      />
      
      {/* Ground glow */}
      <pointLight
        position={[0, 0.2, 0]}
        intensity={0.8}
        color="#FF6A00"
        distance={8}
        decay={2}
      />
      
      {/* Rim lights for depth */}
      <pointLight
        position={[-10, 5, 0]}
        intensity={0.5}
        color="#bf00ff"
        distance={20}
        decay={2}
      />
      <pointLight
        position={[10, 5, 0]}
        intensity={0.5}
        color="#bf00ff"
        distance={20}
        decay={2}
      />
    </group>
  );
}

export default EnvironmentLighting;
