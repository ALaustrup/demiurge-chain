'use client';

/**
 * Avatar Component
 * 
 * User avatar with fallback and online indicator
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const onlineIndicatorSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.split(/[\s#@]+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function getColorFromName(name?: string): string {
  if (!name) return 'from-gray-500 to-gray-600';
  
  const colors = [
    'from-red-500 to-orange-500',
    'from-orange-500 to-yellow-500',
    'from-yellow-500 to-green-500',
    'from-green-500 to-teal-500',
    'from-teal-500 to-cyan-500',
    'from-cyan-500 to-blue-500',
    'from-blue-500 to-indigo-500',
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-red-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  showOnline = false,
  isOnline = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center',
          'ring-2 ring-white/10',
          sizes[size],
          showFallback && `bg-gradient-to-br ${getColorFromName(name)}`
        )}
      >
        {showFallback ? (
          <span className="font-display font-bold text-white/90">
            {getInitials(name)}
          </span>
        ) : (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      {/* Online indicator */}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-void',
            onlineIndicatorSizes[size],
            isOnline
              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
              : 'bg-gray-500'
          )}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group (for showing multiple avatars stacked)
 */
interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-void"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-white/10 ring-2 ring-void',
            'font-display text-text-secondary',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
