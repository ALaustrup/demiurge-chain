'use client';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // TODO: In production, send to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[400px] p-8"
        >
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-display tracking-wider text-text-primary mb-3">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-lg font-display text-sm tracking-wider
                  bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20
                  border border-neon-cyan/30 text-neon-cyan
                  hover:border-neon-cyan/60 hover:shadow-neon-cyan
                  transition-all duration-300"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-lg font-display text-sm tracking-wider
                  bg-white/5 border border-white/10 text-text-secondary
                  hover:bg-white/10 hover:text-text-primary
                  transition-all duration-300"
              >
                Reload Page
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Async error boundary for Suspense
 */
interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function AsyncBoundary({ children, fallback, loadingFallback }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {/* Suspense wraps children for async loading */}
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

import React from 'react';

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-cyan border-t-transparent" />
    </div>
  );
}

export default ErrorBoundary;
