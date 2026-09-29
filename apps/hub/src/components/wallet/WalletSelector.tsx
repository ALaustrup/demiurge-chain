'use client';

import { useState, useEffect } from 'react';
import { LinkedWallet, getLinkedWallets, generateAddressFromQorId } from '@/lib/qor-wallet';

interface WalletSelectorProps {
  qorId: string;
  selectedAddress: string;
  onSelectAddress: (address: string) => void;
  onAddWallet?: () => void;
}

export function WalletSelector({
  qorId,
  selectedAddress,
  onSelectAddress,
  onAddWallet,
}: WalletSelectorProps) {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadWallets();
  }, [qorId]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const linkedWallets = await getLinkedWallets(qorId);
      setWallets(linkedWallets);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      // Fallback to primary wallet
      const primaryAddress = generateAddressFromQorId(qorId);
      setWallets([{
        address: primaryAddress,
        label: 'Primary Wallet',
        isPrimary: true,
        createdAt: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const selectedWallet = wallets.find(w => w.address === selectedAddress);

  if (loading) {
    return (
      <div className="glass-panel px-4 py-2 rounded">
        <div className="animate-pulse text-gray-400">Loading wallets...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="glass-panel px-4 py-2 rounded flex items-center gap-2 hover:chroma-glow transition-all w-full"
      >
        <div className="flex-1 text-left">
          <div className="text-sm text-gray-400">Selected Wallet</div>
          <div className="font-mono text-sm text-white">
            {selectedWallet?.label || formatAddress(selectedAddress)}
          </div>
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 w-full glass-panel rounded-lg p-2 z-20 max-h-64 overflow-y-auto">
            {wallets.map((wallet) => (
              <button
                key={wallet.address}
                onClick={() => {
                  onSelectAddress(wallet.address);
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800/50 transition-colors ${
                  wallet.address === selectedAddress ? 'bg-demiurge-cyan/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {wallet.label || 'Unnamed Wallet'}
                      {wallet.isPrimary && (
                        <span className="ml-2 text-xs text-demiurge-cyan">(Primary)</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-400 mt-1">
                      {formatAddress(wallet.address)}
                    </div>
                  </div>
                  {wallet.address === selectedAddress && (
                    <span className="text-demiurge-cyan">✓</span>
                  )}
                </div>
              </button>
            ))}
            
            {onAddWallet && (
              <button
                onClick={() => {
                  onAddWallet();
                  setShowDropdown(false);
                }}
                className="w-full mt-2 px-3 py-2 rounded border-2 border-dashed border-demiurge-cyan/50 text-demiurge-cyan hover:border-demiurge-cyan transition-colors text-sm"
              >
                + Add New Wallet
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
