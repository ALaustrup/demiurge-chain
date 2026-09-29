'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useChainStore, selectBlockHeight, selectTps, selectValidators, selectConnectionStatus } from '@/store/chainStore';
import { useAuth } from '@/contexts/AuthContext';
import { HolographicCard, DataDisplay } from './HolographicCard';
import { WalletConnector } from './WalletConnector';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMIURGE COMMAND TERMINAL - Dark-Mode Ethereal Glassmorphism Dashboard
// Industrial Sci-Fi HUD with volumetric depth and real-time chain data
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CORNER ACCENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function CornerAccents({ className = '' }: { className?: string }) {
  return (
    <>
      {/* Top-left corner */}
      <div className={`absolute top-0 left-0 w-5 h-5 border-l border-t border-neon-cyan/30 ${className}`} />
      {/* Top-right corner */}
      <div className={`absolute top-0 right-0 w-5 h-5 border-r border-t border-neon-cyan/30 ${className}`} />
      {/* Bottom-left corner */}
      <div className={`absolute bottom-0 left-0 w-5 h-5 border-l border-b border-neon-cyan/30 ${className}`} />
      {/* Bottom-right corner */}
      <div className={`absolute bottom-0 right-0 w-5 h-5 border-r border-b border-neon-cyan/30 ${className}`} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM MODULE CARD - HUD-style panel
// ─────────────────────────────────────────────────────────────────────────────

interface SystemModuleProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
  status: 'online' | 'offline' | 'syncing';
  delay?: number;
}

function SystemModule({ icon, title, value, subtitle, href, status, delay = 0 }: SystemModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      <Link href={href} className="block group">
        <div className="relative p-5 rounded-lg overflow-hidden transition-all duration-500 ease-out-expo
          bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]
          hover:bg-white/[0.05] hover:border-neon-cyan/20
          hover:shadow-glass-elevated hover:-translate-y-1">
          
          <CornerAccents className="transition-all duration-500 group-hover:w-7 group-hover:h-7 group-hover:border-neon-cyan/60" />
          
          {/* Status indicator */}
          <div className="absolute top-3 right-3">
            <div className={`w-1.5 h-1.5 rounded-full ${
              status === 'online' ? 'bg-status-online animate-status-pulse shadow-status-online' :
              status === 'syncing' ? 'bg-neon-cyan animate-pulse' :
              'bg-text-tertiary'
            }`} />
          </div>
          
          {/* Icon */}
          <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="font-display text-[11px] text-text-secondary tracking-widest mb-1 uppercase">
            {title}
          </h3>
          
          {/* Value */}
          <div className="font-mono text-xl font-medium text-text-primary group-hover:text-neon-cyan transition-colors">
            {value}
          </div>
          
          {/* Subtitle */}
          <p className="font-mono text-[10px] text-text-tertiary mt-1 tracking-wide">
            {subtitle}
          </p>
          
          {/* Hover glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN STATUS BAR - Real-time blockchain metrics
// ─────────────────────────────────────────────────────────────────────────────

function ChainStatusBar() {
  const connectionStatus = useChainStore(selectConnectionStatus);
  const blockHeight = useChainStore(selectBlockHeight);
  const tps = useChainStore(selectTps);
  const validators = useChainStore(selectValidators);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-8"
    >
      <div className="relative p-4 rounded-lg overflow-hidden
        bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]">
        
        <CornerAccents />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-status-online shadow-status-online animate-status-pulse' 
                : connectionStatus === 'connecting'
                ? 'bg-neon-cyan animate-pulse'
                : 'bg-status-error'
            }`} />
            <span className="font-display text-[11px] tracking-widest text-text-secondary uppercase">
              {connectionStatus === 'connected' ? 'MAINNET LIVE' : 
               connectionStatus === 'connecting' ? 'SYNCING...' : 'OFFLINE'}
            </span>
          </div>
          
          {/* Metrics */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] tracking-wider text-text-tertiary">BLOCK</span>
              <span className="font-mono text-sm text-neon-cyan animate-data-pulse">
                {blockHeight.toLocaleString()}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] tracking-wider text-text-tertiary">TPS</span>
              <span className="font-mono text-sm text-neon-cyan">
                {tps.toFixed(1)}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] tracking-wider text-text-tertiary">VALIDATORS</span>
              <span className="font-mono text-sm text-neon-cyan">
                {validators}
              </span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] tracking-wider text-text-tertiary">FINALITY</span>
              <span className="font-mono text-sm text-status-online">
                &lt; 2s
              </span>
            </div>
          </div>
        </div>
        
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PANEL - User identity display
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePanel() {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [maxXp, setMaxXp] = useState(1000);
  
  // Get real level/XP from QOR Auth or default to 1
  useEffect(() => {
    if (user) {
      // TODO: Get level/XP from user profile when implemented
      // For now, start at level 1
      setLevel(1);
      setXp(0);
      setMaxXp(1000);
    }
  }, [user]);
  
  const xpPercent = (xp / maxXp) * 100;
  
  // Extract display name - prefer qor_id username part
  const displayName = user?.qor_id?.split('#')[0] || user?.display_name || 'Anonymous';
  // Show QOR ID if available, otherwise show truncated user ID
  const qorIdDisplay = user?.qor_id || (user?.id ? `QOR-${user.id.slice(0, 8).toUpperCase()}` : 'Not connected');
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-5 rounded-lg overflow-hidden
        bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]"
    >
      <CornerAccents />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 
          border border-neon-cyan/30 flex items-center justify-center">
          <span className="text-2xl">{user?.role === 'god' ? '👑' : '👤'}</span>
        </div>
        
        {/* Identity */}
        <div className="flex-1">
          <h3 className="font-display text-sm text-text-primary tracking-wide">
            {displayName}
          </h3>
          <p className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {qorIdDisplay}
          </p>
        </div>
        
        {/* Level Badge */}
        <div className="text-center">
          <div className="font-mono text-2xl font-bold text-neon-cyan">
            {level}
          </div>
          <span className="font-display text-[9px] text-text-tertiary tracking-widest">LEVEL</span>
        </div>
      </div>
      
      {/* Role Badge for God mode */}
      {user?.role === 'god' && (
        <div className="mb-3 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
          <span className="font-mono text-[10px] text-yellow-400 tracking-wider">GOD MODE ACTIVE</span>
        </div>
      )}
      
      {/* XP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-display text-[9px] text-text-tertiary tracking-widest">EXPERIENCE</span>
          <span className="font-mono text-[10px] text-text-secondary">
            {xp.toLocaleString()} / {maxXp.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 bg-void-surface rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
            style={{ boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)' }}
          />
        </div>
      </div>
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACCESS PANEL - System shortcuts
// ─────────────────────────────────────────────────────────────────────────────

function QuickAccessPanel() {
  const quickLinks = [
    { icon: '🔍', title: 'Explorer', href: '/explorer' },
    { icon: '🎨', title: 'Create', href: '/create' },
    { icon: '🏪', title: 'Market', href: '/marketplace' },
    { icon: '💻', title: 'Dev Hub', href: '/development' },
    { icon: '🤖', title: 'Sophia', href: '/social' },
    { icon: '⚙️', title: 'Settings', href: '/settings' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-5 rounded-lg overflow-hidden
        bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]"
    >
      <CornerAccents />
      
      <h3 className="font-display text-[11px] tracking-widest text-text-secondary mb-4 uppercase">
        Quick Access
      </h3>
      
      <div className="grid grid-cols-6 gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="flex flex-col items-center p-3 rounded-md 
              hover:bg-white/[0.03] transition-all duration-300 group"
          >
            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
              {link.icon}
            </span>
            <span className="font-mono text-[9px] text-text-tertiary group-hover:text-neon-cyan transition-colors">
              {link.title}
            </span>
          </Link>
        ))}
      </div>
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET PANEL - CGT Balance display
// ─────────────────────────────────────────────────────────────────────────────

function WalletPanel() {
  const [balance, setBalance] = useState('0.00');
  const [sparks, setSparks] = useState('0');
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-5 rounded-lg overflow-hidden
        bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]"
    >
      <CornerAccents />
      
      <h3 className="font-display text-[11px] tracking-widest text-text-secondary mb-4 uppercase">
        Wallet
      </h3>
      
      {/* CGT Balance */}
      <div className="mb-4">
        <span className="font-display text-[9px] text-text-tertiary tracking-widest">CGT BALANCE</span>
        <div className="font-mono text-3xl font-medium text-neon-cyan mt-1">
          {balance}
        </div>
        <span className="font-mono text-[10px] text-text-tertiary">Creator God Token</span>
      </div>
      
      {/* Sparks */}
      <div className="mb-4">
        <span className="font-display text-[9px] text-text-tertiary tracking-widest">SPARKS</span>
        <div className="font-mono text-xl text-neon-purple mt-1">
          {sparks}
        </div>
      </div>
      
      {/* Connect Button */}
      <WalletConnector variant="full" />
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD GRID
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardGrid() {
  const connect = useChainStore((state) => state.connect);
  const { user } = useAuth();

  // Connect to blockchain on mount
  useEffect(() => {
    connect();
    return () => {
      useChainStore.getState().disconnect();
    };
  }, [connect]);

  // System modules - showing real-time data where possible
  // TODO: Fetch actual counts from RPC/API when available
  const systems = [
    {
      icon: '🎵',
      title: 'QOR Music',
      value: 'Beta',
      subtitle: 'IN DEVELOPMENT',
      href: '/music',
      status: 'syncing' as const,
    },
    {
      icon: '🌐',
      title: 'VYB Social',
      value: '0',
      subtitle: 'NOTIFICATIONS',
      href: '/social',
      status: 'online' as const,
    },
    {
      icon: '🖼️',
      title: 'DRC-369 Studio',
      value: '0',
      subtitle: 'ITEMS OWNED',
      href: '/create',
      status: 'online' as const,
    },
    {
      icon: '⚡',
      title: 'Staking',
      value: '0%',
      subtitle: 'YOUR APY',
      href: '/validators',
      status: 'online' as const,
    },
    {
      icon: '💎',
      title: 'Support',
      value: '—',
      subtitle: 'NO BADGE YET',
      href: '/donate',
      status: 'online' as const,
    },
  ];

  return (
    <div className="min-h-screen pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <motion.div
          className="text-center mb-10 pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-4xl md:text-5xl tracking-widest mb-2">
            <span className="text-neon-gradient">DEMIURGE</span>
          </h1>
          <p className="font-mono text-[11px] text-text-tertiary tracking-[0.3em] uppercase">
            Command Terminal v2.0
          </p>
        </motion.div>

        {/* Chain Status Bar */}
        <ChainStatusBar />

        {/* Main Layout Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Left Column - Profile */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <ProfilePanel />
            <WalletPanel />
          </div>

          {/* Center Column - System Modules */}
          <div className="col-span-12 md:col-span-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {systems.map((system, index) => (
                <SystemModule
                  key={system.title}
                  icon={system.icon}
                  title={system.title}
                  value={system.value}
                  subtitle={system.subtitle}
                  href={system.href}
                  status={system.status}
                  delay={0.2 + index * 0.05}
                />
              ))}
            </div>
          </div>

          {/* Right Column - VYB Social Widget */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-5 rounded-lg overflow-hidden h-full
                bg-white/[0.02] backdrop-blur-glass border border-white/[0.04]"
            >
              <CornerAccents />
              
              <h3 className="font-display text-[11px] tracking-widest text-text-secondary mb-4 uppercase">
                VYB Feed
              </h3>
              
              <div className="space-y-3">
                {/* Empty state - no mock users */}
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🌐</div>
                  <p className="font-mono text-[10px] text-text-tertiary mb-1">
                    No recent activity
                  </p>
                  <p className="font-mono text-[9px] text-text-tertiary/60">
                    Connect with the community
                  </p>
                </div>
              </div>
              
              <Link 
                href="/social" 
                className="block mt-4 text-center font-mono text-[10px] text-neon-cyan hover:underline"
              >
                Explore VYB →
              </Link>
              
              {/* Bottom glow */}
              <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-6">
          <QuickAccessPanel />
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="font-mono text-[10px] text-text-tertiary tracking-wider">
            Ed25519 Signing · WASM Runtime · Zero-Knowledge Proofs
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardGrid;
