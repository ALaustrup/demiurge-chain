'use client';

import { WalletDropdown } from './WalletDropdown';
import { QorIdHeader } from './QorIdHeader';

interface PersistentHUDProps {
  walletComponent?: React.ReactNode; // Allow hub app to inject wallet wrapper
  qorIdComponent?: React.ReactNode; // Allow hub app to inject QOR ID header wrapper
  consensusComponent?: React.ReactNode; // Allow hub app to inject consensus status indicator
}

export function PersistentHUD({ walletComponent, qorIdComponent, consensusComponent }: PersistentHUDProps = {}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel liquid-border p-4 border-b-2">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Left: Logo + Consensus Status */}
        <div className="flex items-center gap-4">
          <a href="/" className="grunge-text text-3xl font-grunge tracking-wider hover:scale-105 transition-transform">
            DEMIURGE
          </a>
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-50"></div>
          <span className="text-xs font-grunge-alt text-gray-400 uppercase tracking-widest">
            Blockchain Ecosystem
          </span>
          {consensusComponent && (
            <>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-50"></div>
              <div className="flex items-center">
                {consensusComponent}
              </div>
            </>
          )}
        </div>
        
        {/* Center: QOR ID Avatar */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {qorIdComponent}
        </div>
        
        {/* Right: Navigation */}
        <div className="flex gap-4 items-center ml-auto">
          {walletComponent || <WalletDropdown />}
          <nav className="flex gap-4 items-center">
            <a
              href="/games"
              className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
            >
              Games
            </a>
            <a
              href="/portal"
              className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-magenta transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
            >
              Portal
            </a>
            <a
              href="/wallet"
              className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-green transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
            >
              Wallet
            </a>
            <a
              href="/social"
              className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-pink transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
            >
              VYB
            </a>
            <a
              href="/nft-portal"
              className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-purple transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
            >
              NFTs
            </a>
          </nav>
        </div>
      </div>
    </nav>
  );
}
