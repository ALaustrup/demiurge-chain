'use client';

/**
 * Input Components
 * 
 * Form inputs with consistent styling and validation support
 */

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Base Input Styles
// ============================================================================

const baseInputStyles = `
  w-full px-4 py-3 rounded-lg
  bg-white/[0.03] border border-white/10
  text-text-primary placeholder-text-tertiary
  font-body text-sm
  transition-all duration-300
  focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20
  disabled:opacity-50 disabled:cursor-not-allowed
  hover:border-white/20
`;

const errorStyles = 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20';

// ============================================================================
// Input
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, containerClassName, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-display tracking-wider text-text-secondary"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && errorStyles,
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Textarea
// ============================================================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, containerClassName, id, ...props }, ref) => {
    const textareaId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-display tracking-wider text-text-secondary"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseInputStyles,
            'min-h-[100px] resize-y',
            error && errorStyles,
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-text-tertiary">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// Select
// ============================================================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, containerClassName, id, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-display tracking-wider text-text-secondary"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              baseInputStyles,
              'appearance-none pr-10 cursor-pointer',
              error && errorStyles,
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-void text-text-primary"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-text-tertiary">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================================================
// Checkbox
// ============================================================================

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const checkboxId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5',
            'text-neon-cyan focus:ring-neon-cyan/50 focus:ring-offset-void',
            'cursor-pointer',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm text-text-secondary cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
