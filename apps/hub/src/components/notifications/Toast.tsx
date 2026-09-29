'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig: Record<ToastType, { icon: string; color: string; bgColor: string; borderColor: string }> = {
  success: {
    icon: '✓',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/50',
  },
  error: {
    icon: '✕',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/50',
  },
  info: {
    icon: 'ℹ',
    color: 'text-demiurge-cyan',
    bgColor: 'bg-demiurge-cyan/10',
    borderColor: 'border-demiurge-cyan/50',
  },
  warning: {
    icon: '⚠',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/50',
  },
};

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const config = toastConfig[toast.type];
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`relative glass-panel rounded-lg p-4 pr-10 min-w-[300px] max-w-md overflow-hidden border ${config.borderColor} ${config.bgColor}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 
                   flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-xs">✕</span>
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ${config.color} text-lg font-bold`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.color}`}>{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-gray-300 mt-0.5">{toast.message}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <motion.div
            className={`h-full ${config.color.replace('text-', 'bg-')}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
