'use client';

/**
 * SplineScene Component
 * 
 * A powerful wrapper for Spline 3D scenes with full API access.
 * Supports:
 * - Loading scenes from URLs or self-hosted files
 * - Event handling (mouse, keyboard, scroll)
 * - Object manipulation (position, scale, rotation, visibility)
 * - Variable control (update Spline variables from React)
 * - State triggers (emit events to Spline)
 * - Loading states and error handling
 */

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application, SPEObject } from '@splinetool/runtime';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SplineSceneProps {
  /** Spline scene URL (from export) */
  scene: string;
  /** Optional className for the container */
  className?: string;
  /** Show loading overlay */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Called when scene is fully loaded */
  onLoad?: (spline: Application) => void;
  /** Called on any Spline event */
  onSplineEvent?: (event: SplineEvent) => void;
  /** Called when mouse hovers an object */
  onMouseHover?: (event: SplineMouseEvent) => void;
  /** Called when mouse leaves an object */
  onMouseOut?: (event: SplineMouseEvent) => void;
  /** Called when an object is clicked */
  onMouseDown?: (event: SplineMouseEvent) => void;
  /** Called when mouse is released */
  onMouseUp?: (event: SplineMouseEvent) => void;
  /** Called on scroll over scene */
  onScroll?: (event: SplineScrollEvent) => void;
  /** Called on keydown */
  onKeyDown?: (event: SplineKeyEvent) => void;
  /** Called on keyup */
  onKeyUp?: (event: SplineKeyEvent) => void;
  /** Initial variables to set on load */
  initialVariables?: Record<string, string | number | boolean>;
  /** Enable debug mode */
  debug?: boolean;
}

export interface SplineEvent {
  type: string;
  target: SPEObject;
}

export interface SplineMouseEvent extends SplineEvent {
  point: { x: number; y: number; z: number };
  distance: number;
}

export interface SplineScrollEvent {
  deltaY: number;
}

export interface SplineKeyEvent {
  key: string;
}

export interface SplineSceneRef {
  /** Get the Spline Application instance */
  getSpline: () => Application | null;
  /** Find an object by name */
  findObjectByName: (name: string) => SPEObject | undefined;
  /** Find an object by ID */
  findObjectById: (id: string) => SPEObject | undefined;
  /** Get all objects in the scene */
  getAllObjects: () => SPEObject[];
  /** Set object position */
  setPosition: (name: string, x: number, y: number, z: number) => void;
  /** Set object scale */
  setScale: (name: string, x: number, y: number, z: number) => void;
  /** Set object rotation (degrees) */
  setRotation: (name: string, x: number, y: number, z: number) => void;
  /** Set object visibility */
  setVisible: (name: string, visible: boolean) => void;
  /** Trigger an event/state on an object */
  emitEvent: (eventName: string, objectName?: string) => void;
  /** Trigger event by object ID */
  emitEventByName: (objectName: string, eventName: string) => void;
  /** Set a Spline variable */
  setVariable: (name: string, value: string | number | boolean) => void;
  /** Get a Spline variable */
  getVariable: (name: string) => any;
  /** Get all variables */
  getAllVariables: () => Record<string, any>;
}

// ============================================================================
// Loading Overlay
// ============================================================================

function DefaultLoadingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 bg-architect-bg flex flex-col items-center justify-center z-10"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated loader */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-neon-cyan/20" />
        <div 
          className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-neon-cyan/20 animate-pulse" />
        </div>
      </div>
      
      {/* Text */}
      <div className="text-center">
        <p className="font-display text-sm tracking-wider text-neon-cyan uppercase">
          Loading Experience
        </p>
        <p className="mt-2 text-xs text-text-tertiary font-mono">
          Initializing 3D environment...
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SplineScene Component
// ============================================================================

export const SplineScene = forwardRef<SplineSceneRef, SplineSceneProps>(
  function SplineScene(
    {
      scene,
      className,
      showLoading = true,
      loadingComponent,
      onLoad,
      onSplineEvent,
      onMouseHover,
      onMouseOut,
      onMouseDown,
      onMouseUp,
      onScroll,
      onKeyDown,
      onKeyUp,
      initialVariables,
      debug = false,
    },
    ref
  ) {
    const splineRef = useRef<Application | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debug logger
    const log = useCallback((...args: any[]) => {
      if (debug) {
        console.log('[SplineScene]', ...args);
      }
    }, [debug]);

    // Handle scene load
    const handleLoad = useCallback((spline: Application) => {
      splineRef.current = spline;
      setIsLoading(false);
      log('Scene loaded', spline);

      // Set initial variables
      if (initialVariables) {
        Object.entries(initialVariables).forEach(([name, value]) => {
          try {
            spline.setVariable(name, value);
            log('Set variable', name, value);
          } catch (e) {
            console.warn(`Failed to set variable ${name}:`, e);
          }
        });
      }

      // Call user onLoad
      onLoad?.(spline);
    }, [initialVariables, onLoad, log]);

    // Generic event handler
    const handleEvent = useCallback((eventType: string, event: any) => {
      log('Event:', eventType, event);
      onSplineEvent?.({ type: eventType, target: event.target });
    }, [onSplineEvent, log]);

    // Expose API via ref
    useImperativeHandle(ref, () => ({
      getSpline: () => splineRef.current,

      findObjectByName: (name: string) => {
        return splineRef.current?.findObjectByName(name);
      },

      findObjectById: (id: string) => {
        return splineRef.current?.findObjectById(id);
      },

      getAllObjects: () => {
        return splineRef.current?.getAllObjects() || [];
      },

      setPosition: (name: string, x: number, y: number, z: number) => {
        const obj = splineRef.current?.findObjectByName(name);
        if (obj) {
          obj.position.x = x;
          obj.position.y = y;
          obj.position.z = z;
          log('Set position', name, { x, y, z });
        }
      },

      setScale: (name: string, x: number, y: number, z: number) => {
        const obj = splineRef.current?.findObjectByName(name);
        if (obj) {
          obj.scale.x = x;
          obj.scale.y = y;
          obj.scale.z = z;
          log('Set scale', name, { x, y, z });
        }
      },

      setRotation: (name: string, x: number, y: number, z: number) => {
        const obj = splineRef.current?.findObjectByName(name);
        if (obj) {
          // Convert degrees to radians
          obj.rotation.x = (x * Math.PI) / 180;
          obj.rotation.y = (y * Math.PI) / 180;
          obj.rotation.z = (z * Math.PI) / 180;
          log('Set rotation', name, { x, y, z });
        }
      },

      setVisible: (name: string, visible: boolean) => {
        const obj = splineRef.current?.findObjectByName(name);
        if (obj) {
          obj.visible = visible;
          log('Set visible', name, visible);
        }
      },

      emitEvent: (eventName: string, objectName?: string) => {
        if (objectName) {
          (splineRef.current as any)?.emitEventReverse(eventName, objectName);
        } else {
          (splineRef.current as any)?.emitEvent(eventName);
        }
        log('Emit event', eventName, objectName);
      },

      emitEventByName: (objectName: string, eventName: string) => {
        (splineRef.current as any)?.emitEventReverse(eventName, objectName);
        log('Emit event by name', objectName, eventName);
      },

      setVariable: (name: string, value: string | number | boolean) => {
        splineRef.current?.setVariable(name, value);
        log('Set variable', name, value);
      },

      getVariable: (name: string) => {
        return splineRef.current?.getVariable(name);
      },

      getAllVariables: () => {
        return splineRef.current?.getVariables() || {};
      },
    }), [log]);

    return (
      <div className={cn('relative w-full h-full', className)}>
        {/* Loading overlay */}
        <AnimatePresence>
          {showLoading && isLoading && (
            loadingComponent || <DefaultLoadingOverlay />
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-architect-bg z-20">
            <div className="text-center">
              <p className="text-red-400 font-display">Failed to load scene</p>
              <p className="text-sm text-text-tertiary mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Spline scene */}
        <Spline
          scene={scene}
          onLoad={handleLoad}
          onSplineMouseHover={(e: any) => {
            handleEvent('mouseHover', e);
            onMouseHover?.(e as SplineMouseEvent);
          }}
          onSplineMouseDown={(e: any) => {
            handleEvent('mouseDown', e);
            onMouseDown?.(e as SplineMouseEvent);
          }}
          onSplineMouseUp={(e: any) => {
            handleEvent('mouseUp', e);
            onMouseUp?.(e as SplineMouseEvent);
          }}
          onSplineKeyDown={(e: any) => {
            handleEvent('keyDown', e);
            onKeyDown?.(e as SplineKeyEvent);
          }}
          onSplineKeyUp={(e: any) => {
            handleEvent('keyUp', e);
            onKeyUp?.(e as SplineKeyEvent);
          }}
          onSplineScroll={(e: any) => {
            handleEvent('scroll', e);
            onScroll?.(e as SplineScrollEvent);
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  }
);

export default SplineScene;
