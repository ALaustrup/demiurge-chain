'use client';

/**
 * Card Component
 * 
 * Glassmorphism card with header, content, and footer sections
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Card Container
// ============================================================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'interactive';
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', noPadding = false, className, ...props }, ref) => {
    const variants = {
      default: 'glass-panel',
      elevated: 'glass-panel shadow-xl shadow-black/20',
      bordered: 'bg-white/[0.02] border border-white/10',
      interactive: 'glass-panel hover:bg-white/[0.04] hover:border-neon-cyan/20 cursor-pointer transition-all duration-300',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden',
          variants[variant],
          !noPadding && 'p-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// Card Header
// ============================================================================

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, description, action, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]',
          className
        )}
        {...props}
      >
        {children || (
          <>
            <div className="space-y-1">
              {title && (
                <h3 className="font-display text-lg tracking-wider text-text-primary">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// Card Content
// ============================================================================

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// ============================================================================
// Card Footer
// ============================================================================

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, align = 'right', className, ...props }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 pt-4 border-t border-white/[0.06]',
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
