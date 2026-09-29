'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainStore, selectBlockHeight, selectTps, selectConnectionStatus } from '@/store/chainStore';
import { WalletConnector } from './WalletConnector';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER BAR - Command Terminal Navigation
// Dark-Mode Ethereal Glassmorphism with razor-thin neon accents
// ═══════════════════════════════════════════════════════════════════════════════

export function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [consensusInfo, setConsensusInfo] = useState<{ era: number; validators: number } | null>(null);
  const connect = useChainStore((state) => state.connect);
  const connectionStatus = useChainStore(selectConnectionStatus);
  const blockHeight = useChainStore(selectBlockHeight);
  const tps = useChainStore(selectTps);

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Connect to blockchain on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Fetch consensus info (era + validator count)
  useEffect(() => {
    let mounted = true;
    const fetchConsensus = async () => {
      try {
        const status = await demiurgeRpc.getConsensusStatus();
        if (mounted && status) {
          setConsensusInfo({ era: status.currentEra, validators: status.validators });
        }
      } catch {
        // Silently fail — header already shows offline state
      }
    };
    fetchConsensus();
    const interval = setInterval(fetchConsensus, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const navItems = [
    { label: 'Create', href: '/create' },
    { label: 'VYB', href: '/social' },
    { label: 'Sophia', href: '/sophia' },
    { label: 'Music', href: '/music' },
  ];

  const dropdownItems = [
    { label: 'Docs', href: '/docs', icon: '📚' },
    { label: 'Agents', href: '/agents', icon: '🤖' },
    { label: 'Bounties', href: '/bounties', icon: '🎯' },
    { label: 'Developers', href: '/developers', icon: '💻' },
    { label: 'Explorer', href: '/explorer', icon: '🔍' },
    { label: 'Staking', href: '/staking', icon: '⚡' },
    { label: 'Validators', href: '/validators', icon: '🏛️' },
    { label: 'Analytics', href: '/analytics', icon: '📊' },
    { label: 'Support Us', href: '/donate', icon: '💎' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out-expo
        ${scrolled 
          ? 'bg-void/90 backdrop-blur-glass border-b border-white/[0.04]' 
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      {/* Neon bottom line - only visible when scrolled */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500
          bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent
          ${scrolled ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-md overflow-hidden
              bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20
              border border-neon-cyan/30 group-hover:border-neon-cyan/60
              transition-all duration-300">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-neon-cyan/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-neon-cyan/50" />
              <span className="absolute inset-0 flex items-center justify-center 
                font-display text-sm text-neon-cyan font-bold">D</span>
            </div>
            <span className="hidden md:block font-display text-sm tracking-[0.2em] text-text-primary
              group-hover:text-neon-cyan transition-colors duration-300">
              DEMIURGE
            </span>
          </Link>

          {/* Center: Real-time tickers (desktop only) */}
          <div className="hidden lg:flex items-center gap-5">
            {/* Status dot */}
            <div className="flex items-center gap-2">
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  connectionStatus === 'connected' 
                    ? 'bg-status-online shadow-status-online animate-status-pulse' 
                    : 'bg-status-error'
                }`}
              />
              <span className="font-display text-[9px] tracking-[0.15em] text-text-tertiary uppercase">
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            {/* Block */}
            <div className="flex items-center gap-2">
              <span className="font-display text-[9px] tracking-wider text-text-tertiary">BLK</span>
              <span className="font-mono text-xs text-neon-cyan">
                {blockHeight.toLocaleString()}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            {/* TPS */}
            <div className="flex items-center gap-2">
              <span className="font-display text-[9px] tracking-wider text-text-tertiary">TPS</span>
              <span className="font-mono text-xs text-neon-cyan">
                {tps.toFixed(1)}
              </span>
            </div>
            
            {consensusInfo && (
              <>
                <div className="w-px h-4 bg-white/10" />
                
                {/* Era */}
                <div className="flex items-center gap-2">
                  <span className="font-display text-[9px] tracking-wider text-text-tertiary">ERA</span>
                  <span className="font-mono text-xs text-neon-cyan">
                    {consensusInfo.era}
                  </span>
                </div>
                
                <div className="w-px h-4 bg-white/10" />
                
                {/* Validators */}
                <div className="flex items-center gap-2">
                  <span className="font-display text-[9px] tracking-wider text-text-tertiary">VAL</span>
                  <span className="font-mono text-xs text-green-400">
                    {consensusInfo.validators}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 font-display text-[11px] tracking-[0.1em] text-text-secondary
                  hover:text-neon-cyan hover:bg-white/[0.02] rounded-md
                  transition-all duration-300 uppercase"
              >
                {item.label}
              </Link>
            ))}

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-4 py-2 font-display text-[11px] tracking-[0.1em] text-text-secondary
                  hover:text-neon-cyan hover:bg-white/[0.02] rounded-md
                  transition-all duration-300 uppercase flex items-center gap-1"
              >
                More
                <svg 
                  className={`w-3 h-3 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMenuOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-2 w-52 p-2 z-50 rounded-lg overflow-hidden
                        bg-void-surface/95 backdrop-blur-glass
                        border border-white/[0.06]"
                      style={{
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.05)',
                      }}
                    >
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-neon-cyan/30" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-neon-cyan/30" />
                      
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md
                            font-display text-[11px] tracking-wider text-text-secondary
                            hover:text-neon-cyan hover:bg-white/[0.03]
                            transition-all duration-300 group"
                        >
                          <span className="text-base group-hover:scale-110 transition-transform">
                            {item.icon}
                          </span>
                          <span className="uppercase">{item.label}</span>
                        </Link>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-2" />

            {/* Connect Button */}
            <WalletConnector variant="button" />
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-neon-cyan transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div 
                className="py-4 mt-3 space-y-1 rounded-lg p-3
                  bg-void-surface/95 backdrop-blur-glass border border-white/[0.04]"
              >
                {/* Mobile Chain Status */}
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-status-online' : 'bg-status-error'
                    }`} />
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {connectionStatus === 'connected' ? 'MAINNET' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-neon-cyan">
                      BLK {blockHeight.toLocaleString()}
                    </span>
                    {consensusInfo && (
                      <>
                        <span className="font-mono text-[10px] text-text-tertiary">
                          ERA {consensusInfo.era}
                        </span>
                        <span className="font-mono text-[10px] text-green-400">
                          {consensusInfo.validators} VAL
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {[...navItems, ...dropdownItems].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md
                      font-display text-[11px] tracking-wider text-text-secondary
                      hover:text-neon-cyan hover:bg-white/[0.02]
                      transition-all duration-300"
                  >
                    {'icon' in item && <span className="text-base">{(item as { icon: string }).icon}</span>}
                    <span className="uppercase">{item.label}</span>
                  </Link>
                ))}
                
                <div className="pt-3 mt-3 border-t border-white/[0.04]">
                  <WalletConnector variant="full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default HeaderBar;
