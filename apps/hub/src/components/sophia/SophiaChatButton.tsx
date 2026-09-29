'use client';

import { useState, useEffect } from 'react';
import { SophiaChatPanel } from './SophiaChatPanel';

export function SophiaChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Show tooltip hint after 5 seconds on first visit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const visited = sessionStorage.getItem('sophia_tooltip_shown');
    if (!visited && !hasInteracted) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('sophia_tooltip_shown', '1');
        // Auto-hide after 4 seconds
        setTimeout(() => setShowTooltip(false), 4000);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
    setShowTooltip(false);
  };

  return (
    <>
      {/* Floating Sophia Button */}
      <div className={`fixed bottom-6 right-6 z-40 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
        {/* Tooltip */}
        {showTooltip && (
          <div
            className="absolute bottom-full right-0 mb-3 px-4 py-2 rounded-lg text-sm text-white whitespace-nowrap animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,22,30,0.98))',
              border: '1px solid rgba(255,215,0,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-[#FFD700]">✧</span> Need help? Ask Sophia!
            <div
              className="absolute -bottom-1 right-6 w-2 h-2 rotate-45"
              style={{
                background: 'rgba(26,26,46,0.95)',
                borderRight: '1px solid rgba(255,215,0,0.3)',
                borderBottom: '1px solid rgba(255,215,0,0.3)',
              }}
            />
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleOpen}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
          }}
          title="Ask Sophia"
        >
          <span className="text-2xl group-hover:animate-pulse">✧</span>
        </button>

        {/* Subtle ring pulse */}
        {!hasInteracted && (
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{
              border: '2px solid rgba(255, 215, 0, 0.3)',
              animationDuration: '3s',
            }}
          />
        )}
      </div>

      {/* Chat Panel */}
      <SophiaChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
