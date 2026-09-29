'use client';

/**
 * Terminal Button
 * 
 * Floating button to launch the web terminal from any page.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import terminal to avoid SSR issues
const WebTerminal = dynamic(
  () => import('./WebTerminal').then((mod) => mod.WebTerminal),
  { ssr: false }
);

interface TerminalButtonProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export function TerminalButton({ variant = 'floating', className = '' }: TerminalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <>
        <motion.button
          onClick={() => setIsOpen(true)}
          className={`
            inline-flex items-center gap-2 px-4 py-2
            bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20
            border border-neon-cyan/30 rounded-lg
            text-neon-cyan font-mono text-sm
            hover:from-neon-cyan/30 hover:to-neon-purple/30
            hover:border-neon-cyan/50
            transition-all duration-300
            ${className}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Open Terminal</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10">
            CLI
          </kbd>
        </motion.button>
        
        <WebTerminal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-br from-architect-dark to-void-deep
          border border-neon-cyan/30
          shadow-lg shadow-neon-cyan/20
          flex items-center justify-center
          hover:border-neon-cyan/60 hover:shadow-neon-cyan/40
          transition-all duration-300
          group
          ${className}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Open Terminal (CLI)"
      >
        <svg
          className="w-6 h-6 text-neon-cyan group-hover:text-white transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        
        {/* Tooltip */}
        <span className="absolute right-16 whitespace-nowrap px-2 py-1 rounded bg-void-deep border border-white/10 text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Open Terminal
        </span>
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full border border-neon-cyan/50 animate-ping opacity-20" />
      </motion.button>
      
      <WebTerminal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default TerminalButton;
