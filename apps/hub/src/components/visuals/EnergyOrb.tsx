'use client';

/**
 * EnergyOrb
 * 
 * Animated energy orb visualization for displaying metrics.
 * Perfect for:
 * - Balance displays
 * - Energy meters
 * - Status indicators
 * - Loading states
 * 
 * Can be enhanced with Spline for true 3D depth.
 */

import { useRef, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface EnergyOrbProps {
  /** Value to display (0-100 for percentages, or any number) */
  value?: number;
  /** Maximum value (for percentage calculation) */
  maxValue?: number;
  /** Display label */
  label?: string;
  /** Value format ('number' | 'percentage' | 'currency') */
  format?: 'number' | 'percentage' | 'currency';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color scheme */
  color?: 'cyan' | 'green' | 'purple' | 'gold' | 'red';
  /** Animation state */
  state?: 'idle' | 'active' | 'charging' | 'depleted';
  /** Enable pulse animation */
  enablePulse?: boolean;
  /** Enable particle ring */
  enableParticles?: boolean;
  /** Spline scene URL for 3D orb */
  splineSceneUrl?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

// Size configurations
const SIZE_CONFIG = {
  sm: { container: 80, orb: 50, ring: 70, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { container: 120, orb: 70, ring: 100, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { container: 160, orb: 100, ring: 140, fontSize: 'text-3xl', labelSize: 'text-sm' },
  xl: { container: 200, orb: 130, ring: 180, fontSize: 'text-4xl', labelSize: 'text-base' },
};

// Color configurations
const COLOR_CONFIG = {
  cyan: { primary: '#FF6A00', secondary: '#CC5500', glow: 'rgba(255, 106, 0, 0.4)' },
  green: { primary: '#22C55E', secondary: '#00A896', glow: 'rgba(34, 197, 94, 0.4)' },
  purple: { primary: '#BF00FF', secondary: '#8B00CC', glow: 'rgba(191, 0, 255, 0.4)' },
  gold: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.4)' },
  red: { primary: '#CF6679', secondary: '#B00020', glow: 'rgba(207, 102, 121, 0.4)' },
};

// ============================================================================
// Particle Ring Component
// ============================================================================

function ParticleRing({ 
  size, 
  color, 
  particleCount = 12,
  animationSpeed = 20,
}: { 
  size: number;
  color: string;
  particleCount?: number;
  animationSpeed?: number;
}) {
  const particles = useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (i / particleCount) * 360,
      size: 2 + Math.random() * 2,
      delay: i * 0.1,
    })),
    [particleCount]
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ duration: animationSpeed, repeat: Infinity, ease: 'linear' }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            left: '50%',
            top: '50%',
            transform: `rotate(${particle.angle}deg) translateY(-${size / 2}px)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </motion.div>
  );
}

// ============================================================================
// Concentric Rings Component
// ============================================================================

function ConcentricRings({ size, color, state }: { size: number; color: string; state: string }) {
  const rings = [0.6, 0.75, 0.9];
  
  return (
    <>
      {rings.map((scale, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size * scale,
            height: size * scale,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: `${color}${20 + i * 10}`,
          }}
          animate={state === 'charging' ? {
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </>
  );
}

// ============================================================================
// Core Orb Component
// ============================================================================

function CoreOrb({ 
  size, 
  colors, 
  state,
  percentage,
}: { 
  size: number;
  colors: typeof COLOR_CONFIG.cyan;
  state: string;
  percentage: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: `
          radial-gradient(
            circle at 30% 30%,
            ${colors.primary}40 0%,
            ${colors.secondary}20 50%,
            ${colors.primary}10 100%
          )
        `,
        boxShadow: `
          0 0 ${size * 0.3}px ${colors.glow},
          inset 0 0 ${size * 0.2}px ${colors.primary}20
        `,
      }}
      animate={
        state === 'active' ? {
          boxShadow: [
            `0 0 ${size * 0.3}px ${colors.glow}, inset 0 0 ${size * 0.2}px ${colors.primary}20`,
            `0 0 ${size * 0.5}px ${colors.glow}, inset 0 0 ${size * 0.3}px ${colors.primary}40`,
            `0 0 ${size * 0.3}px ${colors.glow}, inset 0 0 ${size * 0.2}px ${colors.primary}20`,
          ],
        } : state === 'depleted' ? {
          opacity: [1, 0.5, 1],
        } : undefined
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Fill level indicator */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-full"
        style={{
          height: `${percentage}%`,
          background: `linear-gradient(to top, ${colors.primary}60, ${colors.primary}20)`,
          transition: 'height 0.5s ease-out',
        }}
      />

      {/* Highlight */}
      <div
        className="absolute rounded-full"
        style={{
          width: '30%',
          height: '30%',
          top: '15%',
          left: '20%',
          background: `radial-gradient(circle, ${colors.primary}40, transparent)`,
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Value Display Component
// ============================================================================

function ValueDisplay({ 
  value, 
  format, 
  label,
  fontSize,
  labelSize,
  color,
}: { 
  value: number;
  format: string;
  label?: string;
  fontSize: string;
  labelSize: string;
  color: string;
}) {
  const formattedValue = useMemo(() => {
    switch (format) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'currency':
        return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(1);
      default:
        return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : Math.round(value).toString();
    }
  }, [value, format]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
      <motion.span
        className={cn('font-mono font-bold', fontSize)}
        style={{ color }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        key={formattedValue}
      >
        {formattedValue}
      </motion.span>
      {label && (
        <span 
          className={cn('font-display uppercase tracking-wider text-text-tertiary', labelSize)}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EnergyOrb({
  value = 0,
  maxValue = 100,
  label,
  format = 'number',
  size = 'md',
  color = 'cyan',
  state = 'idle',
  enablePulse = true,
  enableParticles = true,
  splineSceneUrl,
  onClick,
  className,
}: EnergyOrbProps) {
  const config = SIZE_CONFIG[size];
  const colors = COLOR_CONFIG[color];
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center cursor-pointer',
        className
      )}
      style={{
        width: config.container,
        height: config.container,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow */}
      {enablePulse && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Concentric rings */}
      <ConcentricRings size={config.ring} color={colors.primary} state={state} />

      {/* Particle ring */}
      {enableParticles && (
        <ParticleRing 
          size={config.ring} 
          color={colors.primary}
          animationSpeed={state === 'charging' ? 10 : 20}
        />
      )}

      {/* Core orb */}
      <CoreOrb 
        size={config.orb} 
        colors={colors} 
        state={state}
        percentage={percentage}
      />

      {/* Value display */}
      <ValueDisplay
        value={value}
        format={format}
        label={label}
        fontSize={config.fontSize}
        labelSize={config.labelSize}
        color={colors.primary}
      />
    </motion.div>
  );
}

export default EnergyOrb;
