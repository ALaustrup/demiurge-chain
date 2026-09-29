'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, EnergyInfo } from '@/lib/demiurge-rpc';

interface EnergyDisplayProps {
  address: string;
}

export function EnergyDisplay({ address }: EnergyDisplayProps) {
  const [energy, setEnergy] = useState<EnergyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadEnergy();
      const interval = setInterval(loadEnergy, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [address]);

  const loadEnergy = async () => {
    try {
      const data = await demiurgeRpc.getEnergy(address);
      setEnergy(data);
    } catch (err) {
      console.error('Failed to load energy:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !energy) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  const percentage = (energy.current / energy.max) * 100;
  const blocksUntilFull = energy.regenerationRate > 0 
    ? Math.ceil((energy.max - energy.current) / energy.regenerationRate)
    : 0;
  const secondsUntilFull = blocksUntilFull * 1; // Assuming 1 second per block
  const isLowEnergy = percentage < 25;

  return (
    <div className={`rounded-lg p-4 border transition-all ${
      isLowEnergy 
        ? 'bg-red-900/30 border-red-500/50' 
        : 'bg-gray-900/50 border-gray-700'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">Energy</h3>
        <span className="text-sm text-gray-400">
          {energy.current.toLocaleString()} / {energy.max.toLocaleString()}
        </span>
      </div>
      
      {/* Energy Bar */}
      <div className="w-full bg-gray-800 rounded-full h-4 mb-2 relative overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${
            percentage > 50
              ? 'bg-gradient-to-r from-green-500 to-green-400'
              : percentage > 25
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
              : 'bg-gradient-to-r from-red-500 to-red-400'
          }`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${
          percentage > 50 ? 'text-green-400' : percentage > 25 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {percentage.toFixed(1)}%
        </span>
        {blocksUntilFull > 0 && energy.regenerationRate > 0 && (
          <span className="text-gray-400">
            Full in ~{blocksUntilFull} blocks ({secondsUntilFull}s)
          </span>
        )}
        {blocksUntilFull === 0 && energy.current >= energy.max && (
          <span className="text-green-400 font-medium">Full</span>
        )}
      </div>

      {isLowEnergy && (
        <div className="mt-2 pt-2 border-t border-red-500/30">
          <p className="text-xs text-red-400 font-medium flex items-center gap-1">
            <span>⚠️</span>
            <span>Low energy warning - Transactions may fail</span>
          </p>
        </div>
      )}

      {energy.regenerationRate > 0 && (
        <div className={`mt-2 pt-2 border-t ${isLowEnergy ? 'border-red-500/30' : 'border-gray-700'}`}>
          <p className="text-xs text-gray-400">
            Regeneration: <span className="text-white font-medium">+{energy.regenerationRate} per block</span>
          </p>
        </div>
      )}
    </div>
  );
}
