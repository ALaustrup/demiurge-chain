'use client';

/**
 * ParticleField
 * 
 * Animated particle background system with multiple modes.
 * CSS-based with optional WebGL enhancement via Spline.
 * 
 * Modes:
 * - ambient: Slow floating particles (default)
 * - energy: Fast energy streams
 * - network: Connected node visualization
 * - storm: Intense particle storm
 */

import { useRef, useEffect, useMemo, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ParticleMode = 'ambient' | 'energy' | 'network' | 'storm';

interface ParticleFieldProps {
  /** Particle behavior mode */
  mode?: ParticleMode;
  /** Number of particles (default varies by mode) */
  particleCount?: number;
  /** Primary color (default: neon cyan) */
  color?: string;
  /** Secondary color for gradients */
  secondaryColor?: string;
  /** Intensity multiplier (0.1 - 2) */
  intensity?: number;
  /** React to mouse movement */
  interactive?: boolean;
  /** Spline scene URL for enhanced visuals */
  splineSceneUrl?: string;
  /** Fixed position background */
  fixed?: boolean;
  /** Z-index */
  zIndex?: number;
  /** Custom className */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  pulse: boolean;
}

// ============================================================================
// Mode Configurations
// ============================================================================

const MODE_CONFIG: Record<ParticleMode, {
  defaultCount: number;
  sizeRange: [number, number];
  speedRange: [number, number];
  opacityRange: [number, number];
  pulseChance: number;
}> = {
  ambient: {
    defaultCount: 50,
    sizeRange: [1, 3],
    speedRange: [0.2, 0.8],
    opacityRange: [0.1, 0.4],
    pulseChance: 0.3,
  },
  energy: {
    defaultCount: 80,
    sizeRange: [1, 2],
    speedRange: [1, 3],
    opacityRange: [0.3, 0.7],
    pulseChance: 0.5,
  },
  network: {
    defaultCount: 30,
    sizeRange: [2, 4],
    speedRange: [0.1, 0.3],
    opacityRange: [0.3, 0.6],
    pulseChance: 0.8,
  },
  storm: {
    defaultCount: 150,
    sizeRange: [0.5, 2],
    speedRange: [2, 5],
    opacityRange: [0.2, 0.5],
    pulseChance: 0.2,
  },
};

// ============================================================================
// Particle Generation
// ============================================================================

function generateParticles(count: number, mode: ParticleMode): Particle[] {
  const config = MODE_CONFIG[mode];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
    opacity: config.opacityRange[0] + Math.random() * (config.opacityRange[1] - config.opacityRange[0]),
    speed: config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]),
    angle: Math.random() * Math.PI * 2,
    pulse: Math.random() < config.pulseChance,
  }));
}

// ============================================================================
// Single Particle Component
// ============================================================================

function ParticleElement({ 
  particle, 
  color, 
  intensity,
  mode,
}: { 
  particle: Particle; 
  color: string;
  intensity: number;
  mode: ParticleMode;
}) {
  const duration = (10 / particle.speed) / intensity;
  
  // Different animation patterns per mode
  const getAnimationVariants = () => {
    switch (mode) {
      case 'energy':
        return {
          animate: {
            x: [0, 50, 100, 150],
            y: [0, -20, 20, 0],
            opacity: [0, particle.opacity * intensity, particle.opacity * intensity, 0],
          },
        };
      case 'storm':
        return {
          animate: {
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            rotate: [0, 360],
          },
        };
      case 'network':
        return {
          animate: {
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          },
        };
      default: // ambient
        return {
          animate: {
            y: [0, -30, 0],
            x: [0, Math.sin(particle.angle) * 20, 0],
          },
        };
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: particle.size * intensity,
        height: particle.size * intensity,
      }}
      {...getAnimationVariants()}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay: Math.random() * 2,
      }}
    >
      <div
        className={cn(
          'w-full h-full rounded-full',
          particle.pulse && 'animate-glow-pulse'
        )}
        style={{
          background: color,
          opacity: particle.opacity * intensity,
          boxShadow: particle.pulse 
            ? `0 0 ${particle.size * 4}px ${color}` 
            : 'none',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Network Lines (for network mode)
// ============================================================================

function NetworkLines({ 
  particles, 
  color,
  maxDistance = 150,
}: { 
  particles: Particle[];
  color: string;
  maxDistance?: number;
}) {
  const lines = useMemo(() => {
    const connections: Array<{ from: number; to: number; opacity: number }> = [];
    
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach((p2, j) => {
        const dx = (p1.x - p2.x) * 10; // Scale to viewport
        const dy = (p1.y - p2.y) * 10;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          connections.push({
            from: i,
            to: i + j + 1,
            opacity: 1 - (distance / maxDistance),
          });
        }
      });
    });
    
    return connections.slice(0, 50); // Limit for performance
  }, [particles, maxDistance]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {lines.map((line, i) => {
        const p1 = particles[line.from];
        const p2 = particles[line.to];
        return (
          <motion.line
            key={i}
            x1={`${p1.x}%`}
            y1={`${p1.y}%`}
            x2={`${p2.x}%`}
            y2={`${p2.y}%`}
            stroke={color}
            strokeWidth={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: line.opacity * 0.3 }}
            transition={{ duration: 2, delay: i * 0.02 }}
          />
        );
      })}
    </svg>
  );
}

// ============================================================================
// Scan Line Effect
// ============================================================================

function ScanLine({ color, intensity }: { color: string; intensity: number }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 20px ${color}`,
      }}
      initial={{ top: '-10%', opacity: 0 }}
      animate={{ top: '110%', opacity: [0, intensity * 0.3, 0] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
        repeatDelay: 2,
      }}
    />
  );
}

// ============================================================================
// Grid Overlay
// ============================================================================

function GridOverlay({ color, opacity = 0.02 }: { color: string; opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ParticleField({
  mode = 'ambient',
  particleCount,
  color = '#FF6A00',
  secondaryColor = '#CC5500',
  intensity = 1,
  interactive = false,
  splineSceneUrl,
  fixed = true,
  zIndex = -1,
  className,
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  
  // Generate particles
  const count = particleCount ?? MODE_CONFIG[mode].defaultCount;
  const particles = useMemo(() => generateParticles(count, mode), [count, mode]);
  
  // Mouse tracking
  useEffect(() => {
    if (!interactive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden pointer-events-none',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className
      )}
      style={{ zIndex }}
    >
      {/* Radial gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
            rgba(255, 106, 0, ${0.03 * intensity}) 0%, 
            transparent 50%)`,
          transition: interactive ? 'background 0.3s ease' : 'none',
        }}
      />

      {/* Grid overlay */}
      <GridOverlay color={secondaryColor} opacity={0.015 * intensity} />

      {/* Network lines (only for network mode) */}
      {mode === 'network' && (
        <NetworkLines particles={particles} color={color} />
      )}

      {/* Particles */}
      {particles.map((particle) => (
        <ParticleElement
          key={particle.id}
          particle={particle}
          color={color}
          intensity={intensity}
          mode={mode}
        />
      ))}

      {/* Scan line */}
      <ScanLine color={color} intensity={intensity} />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(11, 12, 16, 0.4) 100%)',
        }}
      />
    </div>
  );
}

export default ParticleField;
