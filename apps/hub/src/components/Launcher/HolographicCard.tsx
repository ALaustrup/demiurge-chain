'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC CARD - Dark-Mode Ethereal Glassmorphism Component
// Razor-thin borders, bioluminescent glows, volumetric depth
// ═══════════════════════════════════════════════════════════════════════════════

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'compact';
  glow?: 'cyan' | 'purple' | 'white' | 'none';
  animate?: boolean;
}

export function HolographicCard({
  children,
  className = '',
  href,
  onClick,
  variant = 'default',
  glow = 'cyan',
  animate = true,
}: HolographicCardProps) {
  const paddingClass = 
    variant === 'elevated' ? 'p-6' : 
    variant === 'compact' ? 'p-3' : 
    'p-4';

  const glowStyles = {
    cyan: {
      hover: 'hover:border-neon-cyan/30 hover:shadow-neon-cyan',
      line: 'via-neon-cyan/50',
    },
    purple: {
      hover: 'hover:border-neon-purple/30 hover:shadow-neon-purple',
      line: 'via-neon-purple/50',
    },
    white: {
      hover: 'hover:border-white/20 hover:shadow-neon-white',
      line: 'via-white/30',
    },
    none: {
      hover: '',
      line: 'via-white/10',
    },
  };

  const content = (
    <motion.div
      className={`
        relative overflow-hidden rounded-lg
        bg-white/[0.02] backdrop-blur-glass
        border border-white/[0.04]
        transition-all duration-500 ease-out-expo
        ${paddingClass}
        ${glowStyles[glow].hover}
        ${className}
      `}
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      whileHover={animate ? { scale: 1.01, y: -3 } : undefined}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
    >
      {/* Top edge glow line */}
      <div 
        className={`absolute top-0 left-[10%] right-[10%] h-px
          bg-gradient-to-r from-transparent ${glowStyles[glow].line} to-transparent
          opacity-60 transition-opacity duration-500`}
      />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-neon-cyan/20 rounded-tl-lg transition-all duration-500 group-hover:w-6 group-hover:h-6 group-hover:border-neon-cyan/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-neon-cyan/20 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-neon-cyan/20 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-neon-cyan/20 rounded-br-lg" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Bottom edge glow line */}
      <div 
        className={`absolute bottom-0 left-[10%] right-[10%] h-px
          bg-gradient-to-r from-transparent ${glowStyles[glow].line} to-transparent
          opacity-0 hover:opacity-40 transition-opacity duration-500`}
      />
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM MODULE CARD - Dashboard system entries with HUD styling
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemModuleProps {
  icon: string;
  title: string;
  value?: string | number;
  subtitle?: string;
  href: string;
  status?: 'online' | 'offline' | 'syncing';
  delay?: number;
}

export function SystemModuleCard({
  icon,
  title,
  value,
  subtitle,
  href,
  status = 'online',
  delay = 0,
}: SystemModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={href} className="block group">
        <div className="relative p-5 rounded-lg overflow-hidden h-full cursor-pointer
          bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]
          hover:bg-white/[0.04] hover:border-neon-cyan/20
          hover:shadow-glass-elevated hover:-translate-y-1
          transition-all duration-500 ease-out-expo">
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-neon-cyan/20 
            transition-all duration-500 group-hover:w-6 group-hover:h-6 group-hover:border-neon-cyan/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-neon-cyan/20 
            transition-all duration-500 group-hover:w-6 group-hover:h-6 group-hover:border-neon-cyan/50" />
          
          {/* Status indicator */}
          <div className="absolute top-3 right-3">
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                status === 'online' 
                  ? 'bg-status-online shadow-status-online animate-status-pulse' 
                  : status === 'syncing'
                  ? 'bg-neon-cyan animate-pulse'
                  : 'bg-status-error'
              }`}
            />
          </div>
          
          {/* Icon */}
          <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 
            group-hover:scale-110 transition-all duration-300">
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="font-display text-[11px] text-text-secondary tracking-widest mb-1 uppercase">
            {title}
          </h3>
          
          {/* Value */}
          {value !== undefined && (
            <div className="font-mono text-xl font-medium text-text-primary 
              group-hover:text-neon-cyan transition-colors duration-300">
              {value}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="font-mono text-[10px] text-text-tertiary mt-1 tracking-wide uppercase">
              {subtitle}
            </p>
          )}
          
          {/* Hover arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
            transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <span className="text-neon-cyan text-sm">→</span>
          </div>
          
          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px 
            bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA DISPLAY - Real-time blockchain data with terminal styling
// ═══════════════════════════════════════════════════════════════════════════════

interface DataDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  live?: boolean;
}

export function DataDisplay({ label, value, unit, trend, className = '', live = false }: DataDisplayProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-display text-[9px] text-text-tertiary tracking-widest mb-1 uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-lg font-medium text-neon-cyan ${live ? 'animate-data-pulse' : ''}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="font-mono text-[10px] text-text-tertiary">{unit}</span>}
        {trend && (
          <span className={`text-xs ml-2 ${
            trend === 'up' ? 'text-status-online' : 
            trend === 'down' ? 'text-status-error' : 
            'text-text-tertiary'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

export default HolographicCard;
