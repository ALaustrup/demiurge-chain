'use client';

/**
 * ProcessingIndicator
 * 
 * Premium loading/processing animation component.
 * Multiple styles for different contexts:
 * - Spinner: Classic rotating indicator
 * - Orbital: Orbiting particles
 * - Pulse: Breathing effect
 * - DNA: Double helix
 * - Grid: Matrix-style loading
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ProcessingIndicatorProps {
  /** Visual style */
  variant?: 'spinner' | 'orbital' | 'pulse' | 'dna' | 'grid';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Primary color */
  color?: string;
  /** Loading text */
  text?: string;
  /** Show percentage */
  progress?: number;
  /** Custom className */
  className?: string;
}

// Size configurations
const SIZE_CONFIG = {
  sm: { container: 32, strokeWidth: 2, fontSize: 'text-xs' },
  md: { container: 48, strokeWidth: 3, fontSize: 'text-sm' },
  lg: { container: 64, strokeWidth: 4, fontSize: 'text-base' },
};

// ============================================================================
// Spinner Variant
// ============================================================================

function SpinnerVariant({ size, color }: { size: number; color: string }) {
  const strokeWidth = size < 40 ? 2 : 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      {/* Animated arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{
          strokeDashoffset: [circumference, circumference * 0.25],
          rotate: [0, 360],
        }}
        transition={{
          strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

// ============================================================================
// Orbital Variant
// ============================================================================

function OrbitalVariant({ size, color }: { size: number; color: string }) {
  const orbitCount = 3;
  const particleCount = 3;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Central core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: color,
          boxShadow: `0 0 ${size * 0.3}px ${color}`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Orbits */}
      {Array.from({ length: orbitCount }).map((_, orbitIndex) => (
        <motion.div
          key={orbitIndex}
          className="absolute border rounded-full"
          style={{
            width: size * (0.5 + orbitIndex * 0.2),
            height: size * (0.5 + orbitIndex * 0.2),
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: `${color}20`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3 + orbitIndex,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Particles on orbit */}
          {Array.from({ length: particleCount }).map((_, particleIndex) => (
            <motion.div
              key={particleIndex}
              className="absolute rounded-full"
              style={{
                width: 4,
                height: 4,
                background: color,
                boxShadow: `0 0 8px ${color}`,
                left: '50%',
                top: 0,
                transform: `rotate(${(particleIndex / particleCount) * 360}deg) translateX(-2px)`,
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Pulse Variant
// ============================================================================

function PulseVariant({ size, color }: { size: number; color: string }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
          }}
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{
            scale: [0.3, 1.2],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
      
      {/* Core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: color,
        }}
        animate={{
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ============================================================================
// DNA Variant
// ============================================================================

function DNAVariant({ size, color }: { size: number; color: string }) {
  const nodeCount = 6;
  
  return (
    <div className="relative" style={{ width: size * 0.5, height: size }}>
      {Array.from({ length: nodeCount }).map((_, i) => {
        const yPos = (i / (nodeCount - 1)) * 100;
        
        return (
          <motion.div
            key={i}
            className="absolute flex items-center justify-between w-full"
            style={{ top: `${yPos}%` }}
          >
            {/* Left node */}
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: color }}
              animate={{
                x: [0, size * 0.25, 0],
                scale: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
            
            {/* Connector line */}
            <motion.div
              className="flex-1 h-px mx-1"
              style={{ background: `${color}40` }}
              animate={{
                scaleX: [1, 0.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
            
            {/* Right node */}
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: color }}
              animate={{
                x: [0, -size * 0.25, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Grid Variant
// ============================================================================

function GridVariant({ size, color }: { size: number; color: string }) {
  const gridSize = 3;
  const cells = useMemo(() => {
    const arr = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        arr.push({ x, y, delay: (x + y) * 0.1 });
      }
    }
    return arr;
  }, []);

  const cellSize = size / gridSize - 2;

  return (
    <div 
      className="grid gap-1"
      style={{ 
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        width: size,
        height: size,
      }}
    >
      {cells.map((cell, i) => (
        <motion.div
          key={i}
          className="rounded-sm"
          style={{
            width: cellSize,
            height: cellSize,
            background: color,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: cell.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProcessingIndicator({
  variant = 'spinner',
  size = 'md',
  color = '#FF6A00',
  text,
  progress,
  className,
}: ProcessingIndicatorProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Indicator */}
      <div className="relative">
        {variant === 'spinner' && <SpinnerVariant size={config.container} color={color} />}
        {variant === 'orbital' && <OrbitalVariant size={config.container} color={color} />}
        {variant === 'pulse' && <PulseVariant size={config.container} color={color} />}
        {variant === 'dna' && <DNAVariant size={config.container} color={color} />}
        {variant === 'grid' && <GridVariant size={config.container} color={color} />}
        
        {/* Progress overlay for spinner */}
        {progress !== undefined && variant === 'spinner' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono" style={{ color }}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      {text && (
        <motion.p
          className={cn('font-display uppercase tracking-wider text-text-tertiary', config.fontSize)}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export default ProcessingIndicator;
