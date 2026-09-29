'use client';

/**
 * Badge Component
 * 
 * Status indicators and labels
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyan' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-white/10 text-text-secondary border-white/10',
  success: 'bg-green-500/10 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  purple: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30',
};

const dotColors = {
  default: 'bg-text-tertiary',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
  cyan: 'bg-neon-cyan',
  purple: 'bg-neon-purple',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-display tracking-wider uppercase border rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Online status badge
 */
export function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <Badge
      variant={isOnline ? 'success' : 'default'}
      size="sm"
      dot
    >
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  );
}

/**
 * NFT rarity badge
 */
export function RarityBadge({ rarity }: { rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' }) {
  const rarityVariants: Record<string, BadgeProps['variant']> = {
    common: 'default',
    uncommon: 'success',
    rare: 'info',
    epic: 'purple',
    legendary: 'warning',
  };

  return (
    <Badge variant={rarityVariants[rarity]} size="sm">
      {rarity}
    </Badge>
  );
}

/**
 * Transaction status badge
 */
export function TxStatusBadge({ status }: { status: 'pending' | 'confirmed' | 'failed' }) {
  const statusVariants: Record<string, BadgeProps['variant']> = {
    pending: 'warning',
    confirmed: 'success',
    failed: 'error',
  };

  return (
    <Badge variant={statusVariants[status]} size="sm" dot>
      {status}
    </Badge>
  );
}
