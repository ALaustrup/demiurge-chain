'use client';

/**
 * Skeleton Loading Components
 * 
 * Provides visual feedback while content is loading
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean;
}

/**
 * Base skeleton element
 */
export function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/5 rounded',
        animate && 'animate-pulse',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton for text lines
 */
interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ 
  lines = 1, 
  lastLineWidth = '70%',
  className 
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatars/profile images
 */
interface SkeletonAvatarProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  return (
    <Skeleton className={cn('rounded-full', avatarSizes[size], className)} />
  );
}

/**
 * Skeleton card (for feed items, etc.)
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('glass-panel p-4 rounded-xl space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />
      
      {/* Actions */}
      <div className="flex gap-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for profile header
 */
export function SkeletonProfileHeader({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Banner */}
      <Skeleton className="h-32 w-full rounded-xl" />
      
      {/* Avatar and info */}
      <div className="flex items-end gap-4 -mt-12 px-4">
        <SkeletonAvatar size="xl" className="border-4 border-void" />
        <div className="flex-1 space-y-2 pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Bio */}
      <div className="px-4">
        <SkeletonText lines={2} />
      </div>
      
      {/* Stats */}
      <div className="flex gap-6 px-4">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for NFT card
 */
export function SkeletonNFTCard({ className }: SkeletonProps) {
  return (
    <div className={cn('glass-panel rounded-xl overflow-hidden', className)}>
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for stats widget
 */
export function SkeletonStatsWidget({ className }: SkeletonProps) {
  return (
    <div className={cn('glass-panel p-4 rounded-xl', className)}>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
