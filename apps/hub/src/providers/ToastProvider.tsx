'use client';

/**
 * Toast Notification Provider
 * 
 * Provides styled toast notifications throughout the app
 * using Sonner with custom Demiurge styling
 */

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors={false}
      closeButton={true}
      duration={4000}
      toastOptions={{
        style: {
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.05)',
        },
        classNames: {
          toast: 'glass-panel',
          title: 'font-display tracking-wider',
          description: 'text-text-secondary',
          actionButton: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30',
          cancelButton: 'bg-white/5 text-text-secondary',
          closeButton: 'bg-white/5 hover:bg-white/10 border-white/10',
          success: 'border-l-4 border-l-green-500',
          error: 'border-l-4 border-l-red-500',
          warning: 'border-l-4 border-l-yellow-500',
          info: 'border-l-4 border-l-neon-cyan',
        },
      }}
    />
  );
}

// ============================================================================
// Toast Helper Functions
// ============================================================================

import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Custom toast with Demiurge styling
 */
export const toast = {
  /**
   * Success toast with green accent
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Error toast with red accent
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 6000, // Errors stay longer
      action: options?.action,
    });
  },

  /**
   * Warning toast with yellow accent
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Info toast with cyan accent
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
    });
  },

  /**
   * Loading toast (returns ID to dismiss later)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Promise toast - shows loading, then success/error
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Custom toast with full control
   */
  custom: (content: React.ReactElement, options?: ToastOptions) => {
    return sonnerToast.custom(() => content, {
      duration: options?.duration,
    });
  },
};

export default ToastProvider;
