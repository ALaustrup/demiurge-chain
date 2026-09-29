'use client';

/**
 * Camera Controller
 * 
 * Manages smooth camera transitions, mouse-based orbit,
 * and zone-based camera positioning.
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';
import { useWorldStore, ZONES } from './WorldProvider';

interface CameraControllerProps {
  enableOrbit?: boolean;
  enablePan?: boolean;
  enableZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
  dampingFactor?: number;
  transitionSpeed?: number;
}

export function CameraController({
  enableOrbit = true,
  enablePan = false,
  enableZoom = true,
  minDistance = 5,
  maxDistance = 20,
  dampingFactor = 0.05,
  transitionSpeed = 2,
}: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  const {
    currentZone,
    cameraTarget,
    cameraPosition,
    isTransitioning,
    setTransitioning,
  } = useWorldStore();
  
  // Target vectors for smooth interpolation
  const targetPosition = useRef(new Vector3(...cameraPosition));
  const targetLookAt = useRef(new Vector3(...cameraTarget));
  const currentLookAt = useRef(new Vector3(...cameraTarget));
  
  // Update targets when zone changes
  useEffect(() => {
    const zone = ZONES[currentZone];
    targetLookAt.current.set(...zone.position);
    targetPosition.current.set(
      zone.position[0],
      zone.position[1] + 3,
      zone.position[2] + 8
    );
  }, [currentZone]);
  
  // Update targets when explicit camera target changes
  useEffect(() => {
    targetLookAt.current.set(...cameraTarget);
  }, [cameraTarget]);
  
  useEffect(() => {
    targetPosition.current.set(...cameraPosition);
  }, [cameraPosition]);
  
  // Animation loop
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    
    const lerpFactor = 1 - Math.pow(0.001, delta * transitionSpeed);
    
    // Smooth camera position interpolation
    camera.position.lerp(targetPosition.current, lerpFactor);
    
    // Smooth look-at interpolation
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    controlsRef.current.target.copy(currentLookAt.current);
    
    // Check if transition is complete
    if (isTransitioning) {
      const positionDelta = camera.position.distanceTo(targetPosition.current);
      const lookAtDelta = currentLookAt.current.distanceTo(targetLookAt.current);
      
      if (positionDelta < 0.1 && lookAtDelta < 0.1) {
        setTransitioning(false);
      }
    }
    
    controlsRef.current.update();
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={enableOrbit}
      enablePan={enablePan}
      enableZoom={enableZoom}
      minDistance={minDistance}
      maxDistance={maxDistance}
      dampingFactor={dampingFactor}
      enableDamping
      // Limit vertical rotation
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      // Limit horizontal rotation
      minAzimuthAngle={-Math.PI / 3}
      maxAzimuthAngle={Math.PI / 3}
      // Smooth controls
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
}

/**
 * Mouse parallax effect for subtle camera movement
 */
export function MouseParallax({ intensity = 0.02 }: { intensity?: number }) {
  const { camera } = useThree();
  const mousePosition = useRef({ x: 0, y: 0 });
  const basePosition = useRef(new Vector3());
  
  useEffect(() => {
    basePosition.current.copy(camera.position);
    
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mousePosition.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);
  
  useFrame((_, delta) => {
    const offsetX = mousePosition.current.x * intensity;
    const offsetY = -mousePosition.current.y * intensity;
    
    camera.position.x = MathUtils.lerp(
      camera.position.x,
      basePosition.current.x + offsetX,
      delta * 2
    );
    camera.position.y = MathUtils.lerp(
      camera.position.y,
      basePosition.current.y + offsetY,
      delta * 2
    );
  });
  
  return null;
}

export default CameraController;
