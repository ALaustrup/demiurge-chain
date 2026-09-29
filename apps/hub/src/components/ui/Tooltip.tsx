'use client';

/**
 * Tooltip Component
 * 
 * Simple tooltip using CSS only (no additional dependencies)
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrows = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-white/10 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-white/10 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-white/10 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-white/10 border-y-transparent border-l-transparent',
};

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      
      {/* Tooltip */}
      <div
        className={cn(
          'absolute z-50 pointer-events-none',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200 delay-150',
          positions[position],
          className
        )}
      >
        <div
          className={cn(
            'px-2 py-1.5 rounded-lg text-xs whitespace-nowrap',
            'bg-white/10 backdrop-blur-lg border border-white/10',
            'text-text-primary shadow-lg'
          )}
        >
          {content}
        </div>
        
        {/* Arrow */}
        <div
          className={cn(
            'absolute w-0 h-0 border-4',
            arrows[position]
          )}
        />
      </div>
    </div>
  );
}
