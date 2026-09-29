'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, EnergyInfo } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface GameHUDProps {
  address: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

export function GameHUD({ address, position = 'top-right', compact = false }: GameHUDProps) {
  const { getBalance, getEnergy } = useBlockchain();
  const [balance, setBalance] = useState('0');
  const [energy, setEnergy] = useState<EnergyInfo | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [address]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bal, energyData] = await Promise.all([
        getBalance(address).catch(() => '0'),
        getEnergy(address).catch(() => null),
      ]);
      setBalance(bal);
      setEnergy(energyData);
    } catch (err) {
      console.error('Failed to load game HUD data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    if (cgt >= 1000) {
      return `${(cgt / 1000).toFixed(1)}K`;
    }
    return cgt.toFixed(2);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
    }
  };

  const energyPercentage = energy ? (energy.current / energy.max) * 100 : 0;
  const energyColor = energyPercentage > 50 ? 'bg-green-500' : energyPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  if (isMinimized) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="glass-panel rounded-lg p-2 hover:chroma-glow transition-all"
          title="Expand HUD"
        >
          <span className="text-white text-sm">⚡</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${compact ? 'w-48' : 'w-64'}`}>
      <div className="glass-panel rounded-lg border border-gray-700/50 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700/50">
          <h3 className="text-xs font-semibold text-white">Demiurge</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="text-gray-400 hover:text-white text-xs px-1"
              title="Quick Actions"
            >
              ⚡
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white text-xs px-1"
              title="Minimize"
            >
              −
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Balance</span>
            <span className="text-sm font-bold text-white">
              {loading ? '...' : `${formatBalance(balance)} CGT`}
            </span>
          </div>

          {/* Energy */}
          {energy && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Energy</span>
                <span className="text-xs text-white font-medium">
                  {energy.current}/{energy.max}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`${energyColor} h-1.5 rounded-full transition-all`}
                  style={{ width: `${energyPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="pt-2 border-t border-gray-700/50 space-y-1">
              <button
                className="w-full text-xs glass-panel py-1 px-2 rounded hover:chroma-glow transition-all"
                onClick={() => {
                  // TODO: Open spend modal
                }}
              >
                💰 Spend
              </button>
              <button
                className="w-full text-xs glass-panel py-1 px-2 rounded hover:chroma-glow transition-all"
                onClick={() => {
                  // TODO: Open earn modal
                }}
              >
                ⭐ Earn
              </button>
              <button
                className="w-full text-xs glass-panel py-1 px-2 rounded hover:chroma-glow transition-all"
                onClick={() => {
                  // TODO: Open assets modal
                }}
              >
                🎮 Assets
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
