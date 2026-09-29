'use client';

/**
 * PortalTransition
 * 
 * Cinematic portal/warp transition effect for page navigation.
 * Can be used for:
 * - Page transitions
 * - Zone navigation in 3D world
 * - Modal reveals
 * - Loading screens
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PortalTransitionProps {
  /** Whether the portal is active */
  isActive: boolean;
  /** Transition direction */
  direction?: 'in' | 'out';
  /** Visual style */
  variant?: 'warp' | 'dissolve' | 'iris' | 'scan';
  /** Duration in seconds */
  duration?: number;
  /** Primary color */
  color?: string;
  /** Callback when transition completes */
  onComplete?: () => void;
  /** Children to reveal after transition */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Warp Lines Component
// ============================================================================

function WarpLines({ color, direction }: { color: string; direction: string }) {
  const lineCount = 40;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: lineCount }).map((_, i) => {
        const angle = (i / lineCount) * 360;
        const delay = i * 0.02;
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 origin-left"
            style={{
              width: '150%',
              height: 2,
              background: `linear-gradient(90deg, ${color}, transparent)`,
              transform: `rotate(${angle}deg)`,
            }}
            initial={{ 
              scaleX: direction === 'in' ? 0 : 1,
              opacity: 0,
            }}
            animate={{ 
              scaleX: direction === 'in' ? 1 : 0,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Iris Effect Component
// ============================================================================

function IrisEffect({ 
  color, 
  direction, 
  duration,
}: { 
  color: string;
  direction: string;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ 
        clipPath: direction === 'in' 
          ? 'circle(0% at 50% 50%)' 
          : 'circle(150% at 50% 50%)',
      }}
      animate={{ 
        clipPath: direction === 'in' 
          ? 'circle(150% at 50% 50%)' 
          : 'circle(0% at 50% 50%)',
      }}
      transition={{ duration, ease: 'easeInOut' }}
      style={{ background: color }}
    />
  );
}

// ============================================================================
// Scan Effect Component
// ============================================================================

function ScanEffect({ 
  color, 
  direction, 
  duration,
}: { 
  color: string;
  direction: string;
  duration: number;
}) {
  return (
    <>
      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-1"
        style={{
          background: color,
          boxShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
        }}
        initial={{ top: direction === 'in' ? '-5%' : '105%' }}
        animate={{ top: direction === 'in' ? '105%' : '-5%' }}
        transition={{ duration: duration * 0.5, ease: 'easeInOut' }}
      />
      
      {/* Fill behind scan */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ background: 'var(--bg-primary)' }}
        initial={{ 
          top: direction === 'in' ? 0 : '100%',
          bottom: direction === 'in' ? '100%' : 0,
        }}
        animate={{ 
          top: direction === 'in' ? 0 : 0,
          bottom: direction === 'in' ? 0 : '100%',
        }}
        transition={{ duration: duration * 0.5, ease: 'easeInOut' }}
      />
    </>
  );
}

// ============================================================================
// Dissolve Effect Component
// ============================================================================

function DissolveEffect({ 
  direction, 
  duration,
}: { 
  direction: string;
  duration: number;
}) {
  const gridSize = 10;
  const cells = [];
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      cells.push({ x, y, delay: (x + y) * 0.03 });
    }
  }

  return (
    <div className="absolute inset-0 grid" style={{ 
      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
      gridTemplateRows: `repeat(${gridSize}, 1fr)`,
    }}>
      {cells.map((cell, i) => (
        <motion.div
          key={i}
          style={{ background: 'var(--bg-primary)' }}
          initial={{ opacity: direction === 'in' ? 1 : 0 }}
          animate={{ opacity: direction === 'in' ? 0 : 1 }}
          transition={{
            duration: duration * 0.3,
            delay: cell.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Center Flash Component
// ============================================================================

function CenterFlash({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.5, times: [0, 0.2, 1] }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: 20,
          height: 20,
          background: color,
          boxShadow: `0 0 100px 50px ${color}`,
        }}
        animate={{
          scale: [1, 50, 50],
          opacity: [1, 0.8, 0],
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PortalTransition({
  isActive,
  direction = 'in',
  variant = 'warp',
  duration = 1,
  color = '#FF6A00',
  onComplete,
  children,
  className,
}: PortalTransitionProps) {
  const [showContent, setShowContent] = useState(direction === 'out');

  useEffect(() => {
    if (isActive && direction === 'in') {
      const timer = setTimeout(() => {
        setShowContent(true);
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, direction, duration, onComplete]);

  return (
    <div className={cn('relative', className)}>
      {/* Content */}
      <AnimatePresence>
        {showContent && children}
      </AnimatePresence>

      {/* Portal overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Effect based on variant */}
            {variant === 'warp' && (
              <>
                <WarpLines color={color} direction={direction} />
                <CenterFlash color={color} />
              </>
            )}
            
            {variant === 'iris' && (
              <IrisEffect color={color} direction={direction} duration={duration} />
            )}
            
            {variant === 'scan' && (
              <ScanEffect color={color} direction={direction} duration={duration} />
            )}
            
            {variant === 'dissolve' && (
              <DissolveEffect direction={direction} duration={duration} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PortalTransition;
