'use client';

/**
 * Button Component
 * 
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 * Features: loading state, icon support, disabled state
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: `
    bg-gradient-to-r from-neon-cyan to-neon-cyan-dim text-void-deep font-semibold
    hover:shadow-neon-cyan hover:-translate-y-0.5
    active:translate-y-0 active:scale-[0.98]
  `,
  secondary: `
    bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20
    border border-neon-cyan/30 text-neon-cyan
    hover:border-neon-cyan/60 hover:shadow-neon-cyan
    active:scale-[0.98]
  `,
  ghost: `
    bg-transparent text-text-secondary
    hover:bg-white/5 hover:text-text-primary
    active:scale-[0.98]
  `,
  danger: `
    bg-red-500/10 border border-red-500/30 text-red-400
    hover:bg-red-500/20 hover:border-red-500/50
    active:scale-[0.98]
  `,
  outline: `
    bg-transparent border border-white/10 text-text-secondary
    hover:bg-white/5 hover:border-white/20 hover:text-text-primary
    active:scale-[0.98]
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-display tracking-wider uppercase',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:ring-offset-2 focus:ring-offset-void',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:transform-none',
          // Variant styles
          variants[variant],
          // Size styles
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          // Custom className
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size === 'sm' ? 'xs' : 'sm'} />
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
