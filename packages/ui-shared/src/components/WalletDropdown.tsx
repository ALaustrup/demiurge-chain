'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

// Import blockchain client (will be available in hub app)
// For ui-shared package, we'll use a callback pattern
interface WalletDropdownProps {
  onSendClick?: () => void;
  onReceiveClick?: () => void;
  onHistoryClick?: () => void;
  balance?: string; // Raw balance string (in smallest units)
  address?: string | null;
}

export function WalletDropdown({ 
  onSendClick,
  onReceiveClick,
  onHistoryClick,
  balance: externalBalance,
  address: externalAddress,
}: WalletDropdownProps = {}) {
  const [balance, setBalance] = useState<string>('0');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    async function loadBalance() {
      try {
        // Get user profile to fetch on-chain address
        const profile = await qorAuth.getProfile();
        const userAddress = profile.on_chain?.address || externalAddress;
        
        if (userAddress) {
          setAddress(userAddress);
          
          // Use external balance if provided, otherwise fetch from blockchain
          if (externalBalance) {
            setBalance(externalBalance);
          } else {
            // TODO: Fetch balance from blockchain API when available
            // For now, set to 0 if no external balance is provided
            setBalance('0');
          }
        } else {
          // No on-chain address yet
          setBalance('0');
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    }
    
    if (qorAuth.isAuthenticated()) {
      loadBalance();
    } else {
      setLoading(false);
    }
  }, [externalBalance, externalAddress]);

  // Format balance for display (2 decimals, 100 Sparks = 1 CGT)
  const formatBalance = (rawBalance: string): string => {
    const CGT_UNIT = 100;
    const balanceNum = BigInt(rawBalance);
    const whole = balanceNum / BigInt(CGT_UNIT);
    const fractional = balanceNum % BigInt(CGT_UNIT);
    const fractionalStr = fractional.toString().padStart(2, '0');
    return `${whole}.${fractionalStr}`;
  };

  const displayBalance = formatBalance(balance);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all flex items-center gap-2"
      >
        <span className="text-demiurge-cyan font-bold">CGT</span>
        <span className="text-white">
          {loading ? '...' : parseFloat(displayBalance).toFixed(2)}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 glass-panel p-4 rounded-lg min-w-[300px] z-50">
          <h3 className="text-lg font-bold mb-4 text-demiurge-cyan">Wallet</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-demiurge-cyan/20">
              <span className="text-gray-300">Balance:</span>
              <span className="text-demiurge-cyan font-bold text-xl">
                {parseFloat(displayBalance).toFixed(2)} CGT
              </span>
            </div>
            {address && (
              <div className="text-xs text-gray-400 font-mono break-all pb-3 border-b border-demiurge-cyan/20">
                {address}
              </div>
            )}
            <button 
              onClick={() => {
                onSendClick?.();
                setIsOpen(false);
              }}
              className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all"
            >
              Send CGT
            </button>
            <button 
              onClick={() => {
                onReceiveClick?.();
                setIsOpen(false);
              }}
              className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all"
            >
              Receive CGT
            </button>
            <button 
              onClick={() => {
                onHistoryClick?.();
                setIsOpen(false);
              }}
              className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all"
            >
              Transaction History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
