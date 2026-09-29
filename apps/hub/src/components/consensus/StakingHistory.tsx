'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, StakingPoolInfo } from '@/lib/demiurge-rpc';

interface StakingHistoryProps {
  address: string;
}

interface NominationRecord {
  validator: string;
  stake: string;
  era: number;
  timestamp?: number;
}

export function StakingHistory({ address }: StakingHistoryProps) {
  const [nominations, setNominations] = useState<NominationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStakingHistory();
    const interval = setInterval(loadStakingHistory, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [address]);

  const loadStakingHistory = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all validators
      const validators = await demiurgeRpc.getValidators();
      const userNominations: NominationRecord[] = [];

      // Check each validator's staking pool for user's nominations
      for (const validator of validators) {
        try {
          const pool = await demiurgeRpc.getStakingPool(validator.account);
          if (pool) {
            const userNomination = pool.nominators.find(n => n.account.toLowerCase() === address.toLowerCase());
            if (userNomination) {
              userNominations.push({
                validator: validator.account,
                stake: userNomination.stake,
                era: userNomination.era,
              });
            }
          }
        } catch (err) {
          // Skip validators without pools
          continue;
        }
      }

      setNominations(userNominations);
    } catch (err: any) {
      setError(err.message || 'Failed to load staking history');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading && nominations.length === 0) {
    return (
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Staking History</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Staking History</h2>
        <button
          onClick={loadStakingHistory}
          className="text-sm text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {nominations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No active nominations found</p>
          <p className="text-sm mt-2">Start staking to see your nominations here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominations.map((nomination, index) => (
            <div
              key={`${nomination.validator}-${index}`}
              className="bg-gray-800/50 rounded p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-300 mb-1">
                    {formatAddress(nomination.validator)}
                  </p>
                  <p className="text-xs text-gray-400">Era {nomination.era}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {formatBalance(nomination.stake)} CGT
                  </p>
                  <p className="text-xs text-gray-400">Staked</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
