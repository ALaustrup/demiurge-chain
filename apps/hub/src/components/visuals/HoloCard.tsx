'use client';

/**
 * HoloCard
 * 
 * Premium holographic card component with 3D depth and dynamic lighting.
 * Features:
 * - 3D tilt on mouse movement
 * - Holographic sheen effect
 * - Corner accent animations
 * - Data glow pulses
 * - Optional Spline 3D background
 */

import { useRef, useState, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface HoloCardProps {
  children: ReactNode;
  /** Card variant */
  variant?: 'default' | 'neon' | 'glass' | 'data';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Enable 3D tilt effect */
  enableTilt?: boolean;
  /** Tilt intensity (degrees) */
  tiltIntensity?: number;
  /** Enable holographic sheen */
  enableSheen?: boolean;
  /** Enable corner accents */
  showCorners?: boolean;
  /** Enable glow on hover */
  enableGlow?: boolean;
  /** Accent color override */
  accentColor?: string;
  /** Spline scene for 3D background */
  splineSceneUrl?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

// Size configurations
const SIZE_CLASSES = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

// ============================================================================
// Corner Accent Component
// ============================================================================

function CornerAccent({ 
  position, 
  color,
  animated = true,
}: { 
  position: 'tl' | 'tr' | 'bl' | 'br';
  color: string;
  animated?: boolean;
}) {
  const positionClasses = {
    tl: 'top-0 left-0 border-t border-l',
    tr: 'top-0 right-0 border-t border-r',
    bl: 'bottom-0 left-0 border-b border-l',
    br: 'bottom-0 right-0 border-b border-r',
  };

  return (
    <motion.div
      className={cn(
        'absolute w-4 h-4 pointer-events-none',
        positionClasses[position]
      )}
      style={{ borderColor: color }}
      initial={{ opacity: 0.3 }}
      animate={animated ? {
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.1, 1],
      } : undefined}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: position === 'tl' ? 0 : position === 'tr' ? 0.75 : position === 'bl' ? 1.5 : 2.25,
      }}
    />
  );
}

// ============================================================================
// Holographic Sheen Effect
// ============================================================================

function HoloSheen({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        background: `
          linear-gradient(
            ${105 + mouseX * 30}deg,
            transparent 0%,
            rgba(255, 106, 0, 0.05) 30%,
            rgba(255, 106, 0, 0.1) 50%,
            rgba(139, 0, 0, 0.05) 70%,
            transparent 100%
          )
        `,
      }}
    />
  );
}

// ============================================================================
// Data Glow Effect
// ============================================================================

function DataGlow({ variant, isHovered }: { variant: string; isHovered: boolean }) {
  if (variant !== 'data') return null;

  return (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top glow line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #FF6A00, transparent)',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Data pulse dots */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-neon-cyan"
              style={{
                top: '0',
                left: `${25 + i * 25}%`,
              }}
              animate={{
                y: [0, 10, 0],
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Import AnimatePresence
import { AnimatePresence } from 'framer-motion';

// ============================================================================
// Main Component
// ============================================================================

export function HoloCard({
  children,
  variant = 'default',
  size = 'md',
  enableTilt = true,
  tiltIntensity = 10,
  enableSheen = true,
  showCorners = true,
  enableGlow = true,
  accentColor = '#FF6A00',
  splineSceneUrl,
  onClick,
  className,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring for smooth movement
  const springConfig = { damping: 25, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]), springConfig);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enableTilt) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  }, [enableTilt, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  // Variant styles
  const variantStyles = {
    default: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-primary)',
    },
    neon: {
      background: 'var(--bg-surface)',
      border: `1px solid ${accentColor}40`,
    },
    glass: {
      background: 'rgba(31, 40, 51, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 106, 0, 0.1)',
    },
    data: {
      background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
      border: '1px solid var(--border-primary)',
    },
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden cursor-pointer',
        SIZE_CLASSES[size],
        className
      )}
      style={{
        ...variantStyles[variant],
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={{
        rotateX: enableTilt ? rotateX.get() : 0,
        rotateY: enableTilt ? rotateY.get() : 0,
        boxShadow: isHovered && enableGlow
          ? `0 0 30px ${accentColor}20, 0 10px 40px rgba(0,0,0,0.3)`
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
      transition={{ duration: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {/* Holographic sheen */}
      {enableSheen && (
        <HoloSheen mouseX={mouseX.get()} mouseY={mouseY.get()} />
      )}

      {/* Corner accents */}
      {showCorners && (
        <>
          <CornerAccent position="tl" color={accentColor} animated={isHovered} />
          <CornerAccent position="tr" color={accentColor} animated={isHovered} />
          <CornerAccent position="bl" color={accentColor} animated={isHovered} />
          <CornerAccent position="br" color={accentColor} animated={isHovered} />
        </>
      )}

      {/* Data glow effect */}
      <DataGlow variant={variant} isHovered={isHovered} />

      {/* Border glow on hover */}
      <AnimatePresence>
        {isHovered && enableGlow && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: `inset 0 0 20px ${accentColor}10`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export default HoloCard;
