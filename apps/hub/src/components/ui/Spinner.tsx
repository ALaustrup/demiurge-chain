'use client';

/**
 * Spinner Component
 * 
 * Loading spinner with consistent styling
 */

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'cyan' | 'white' | 'current';
}

const sizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-[3px]',
};

const colors = {
  cyan: 'border-neon-cyan border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

export function Spinner({ size = 'md', color = 'cyan', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Full page loading spinner
 */
export function PageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-sm text-text-secondary font-display tracking-wider">
          LOADING
        </p>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator
 */
export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
