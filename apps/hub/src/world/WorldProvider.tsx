'use client';

/**
 * World Provider
 * 
 * Central state management for the immersive 3D world.
 * Manages zones, camera state, focus, and world-level interactions.
 */

import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { create } from 'zustand';
import { Vector3 } from 'three';

// ============================================================================
// Types
// ============================================================================

export type ZoneId = 'command' | 'social' | 'assets' | 'data' | 'experience';

export interface Zone {
  id: ZoneId;
  name: string;
  position: [number, number, number];
  color: string;
  description: string;
}

export interface FocusTarget {
  id: string;
  position: [number, number, number];
  type: 'panel' | 'pillar' | 'orb' | 'node';
}

interface WorldState {
  // Current zone
  currentZone: ZoneId;
  previousZone: ZoneId | null;
  isTransitioning: boolean;
  
  // Camera state
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  cameraFov: number;
  
  // Focus state
  focusedElement: FocusTarget | null;
  hoveredElement: string | null;
  
  // World state
  isLoaded: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  audioEnabled: boolean;
  reducedMotion: boolean;
  
  // Actions
  setZone: (zone: ZoneId) => void;
  setTransitioning: (transitioning: boolean) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraPosition: (position: [number, number, number]) => void;
  setFocusedElement: (element: FocusTarget | null) => void;
  setHoveredElement: (id: string | null) => void;
  setLoaded: (loaded: boolean) => void;
  setQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  setAudioEnabled: (enabled: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
}

// ============================================================================
// Zone Definitions
// ============================================================================

export const ZONES: Record<ZoneId, Zone> = {
  command: {
    id: 'command',
    name: 'Command Chamber',
    position: [0, 0, 0],
    color: '#FF6A00',
    description: 'Central hub - your dashboard to the Demiurge ecosystem',
  },
  social: {
    id: 'social',
    name: 'Social Nexus',
    position: [0, 0, -20],
    color: '#bf00ff',
    description: 'VYB social feed and community connections',
  },
  assets: {
    id: 'assets',
    name: 'Asset Vault',
    position: [20, 0, 0],
    color: '#FFD700',
    description: 'Your NFTs, wallet, and staking operations',
  },
  data: {
    id: 'data',
    name: 'Data Stream',
    position: [0, 0, 20],
    color: '#00ff88',
    description: 'Blockchain explorer and validator metrics',
  },
  experience: {
    id: 'experience',
    name: 'Experience Zone',
    position: [-20, 0, 0],
    color: '#ff6b6b',
    description: 'Games, music, and achievements',
  },
};

// ============================================================================
// Zustand Store
// ============================================================================

export const useWorldStore = create<WorldState>((set) => ({
  // Initial state
  currentZone: 'command',
  previousZone: null,
  isTransitioning: false,
  
  cameraTarget: [0, 1, 0],
  cameraPosition: [0, 3, 8],
  cameraFov: 60,
  
  focusedElement: null,
  hoveredElement: null,
  
  isLoaded: false,
  quality: 'high',
  audioEnabled: true,
  reducedMotion: false,
  
  // Actions
  setZone: (zone) => set((state) => ({
    previousZone: state.currentZone,
    currentZone: zone,
    isTransitioning: true,
    cameraTarget: ZONES[zone].position,
  })),
  
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setFocusedElement: (element) => set({ focusedElement: element }),
  setHoveredElement: (id) => set({ hoveredElement: id }),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setQuality: (quality) => set({ quality }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
}));

// ============================================================================
// Context
// ============================================================================

interface WorldContextValue {
  // Zone navigation
  navigateToZone: (zone: ZoneId) => void;
  getCurrentZone: () => Zone;
  getZone: (id: ZoneId) => Zone;
  
  // Focus management
  focusElement: (target: FocusTarget) => void;
  clearFocus: () => void;
  
  // Camera helpers
  lookAt: (position: [number, number, number]) => void;
  resetCamera: () => void;
  
  // Utilities
  worldToScreen: (position: [number, number, number]) => { x: number; y: number } | null;
}

const WorldContext = createContext<WorldContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface WorldProviderProps {
  children: ReactNode;
}

export function WorldProvider({ children }: WorldProviderProps) {
  const store = useWorldStore();
  
  const navigateToZone = useCallback((zone: ZoneId) => {
    if (store.currentZone === zone || store.isTransitioning) return;
    store.setZone(zone);
    
    // Auto-clear transitioning after animation
    setTimeout(() => {
      store.setTransitioning(false);
    }, 2000);
  }, [store]);
  
  const getCurrentZone = useCallback(() => {
    return ZONES[store.currentZone];
  }, [store.currentZone]);
  
  const getZone = useCallback((id: ZoneId) => {
    return ZONES[id];
  }, []);
  
  const focusElement = useCallback((target: FocusTarget) => {
    store.setFocusedElement(target);
    store.setCameraTarget(target.position);
  }, [store]);
  
  const clearFocus = useCallback(() => {
    store.setFocusedElement(null);
    store.setCameraTarget(ZONES[store.currentZone].position);
  }, [store]);
  
  const lookAt = useCallback((position: [number, number, number]) => {
    store.setCameraTarget(position);
  }, [store]);
  
  const resetCamera = useCallback(() => {
    const zone = ZONES[store.currentZone];
    store.setCameraTarget(zone.position);
    store.setCameraPosition([zone.position[0], zone.position[1] + 3, zone.position[2] + 8]);
  }, [store]);
  
  const worldToScreen = useCallback((position: [number, number, number]) => {
    // This would need access to camera - placeholder for now
    return null;
  }, []);
  
  const value = useMemo<WorldContextValue>(() => ({
    navigateToZone,
    getCurrentZone,
    getZone,
    focusElement,
    clearFocus,
    lookAt,
    resetCamera,
    worldToScreen,
  }), [navigateToZone, getCurrentZone, getZone, focusElement, clearFocus, lookAt, resetCamera, worldToScreen]);
  
  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWorld() {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
}

export default WorldProvider;
