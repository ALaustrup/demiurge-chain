'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, ValidatorInfo, EraInfo, StakingPoolInfo } from '@/lib/demiurge-rpc';

interface ValidatorDashboardProps {
  address?: string;
}

export function ValidatorDashboard({ address }: ValidatorDashboardProps) {
  const [eraInfo, setEraInfo] = useState<EraInfo | null>(null);
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null);
  const [stakingPool, setStakingPool] = useState<StakingPoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedValidator]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [era, validatorsList] = await Promise.all([
        demiurgeRpc.getCurrentEra().catch(() => null),
        demiurgeRpc.getValidators().catch(() => []),
      ]);

      setEraInfo(era);
      setValidators(validatorsList);

      if (selectedValidator) {
        const pool = await demiurgeRpc.getStakingPool(selectedValidator.account).catch(() => null);
        setStakingPool(pool);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load validator data');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100; // 100 Sparks = 1 CGT
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && !eraInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Era Information */}
      {eraInfo && (
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
          <h2 className="text-2xl font-bold mb-4 text-white">Current Era</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Era Number</p>
              <p className="text-xl font-bold text-white">{eraInfo.era}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Block Number</p>
              <p className="text-xl font-bold text-white">{eraInfo.blockNumber.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Rewards</p>
              <p className="text-xl font-bold text-green-400">{formatBalance(eraInfo.totalRewards)} CGT</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Transaction Fees</p>
              <p className="text-xl font-bold text-yellow-400">{formatBalance(eraInfo.transactionFees)} CGT</p>
            </div>
          </div>
        </div>
      )}

      {/* Validators List */}
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Validators ({validators.length})</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {validators.map((validator) => (
            <div
              key={validator.account}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedValidator?.account === validator.account
                  ? 'bg-blue-900/50 border-blue-500'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedValidator(validator)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-gray-300">
                      {validator.account.slice(0, 8)}...{validator.account.slice(-8)}
                    </p>
                    {validator.active && (
                      <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-gray-400">
                      Stake: <span className="text-white font-bold">{formatBalance(validator.stake)} CGT</span>
                    </span>
                    <span className="text-gray-400">
                      Commission: <span className="text-white font-bold">{validator.commission}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Pool Details */}
      {selectedValidator && stakingPool && (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">Staking Pool</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Pool Stake</p>
                <p className="text-xl font-bold text-white">{formatBalance(stakingPool.totalStake)} CGT</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Commission</p>
                <p className="text-xl font-bold text-white">{stakingPool.commission}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Nominators ({stakingPool.nominators.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stakingPool.nominators.map((nominator) => (
                  <div
                    key={nominator.account}
                    className="p-3 bg-gray-800/50 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm text-gray-300">
                        {nominator.account.slice(0, 8)}...{nominator.account.slice(-8)}
                      </p>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatBalance(nominator.stake)} CGT</p>
                        <p className="text-xs text-gray-400">Era {nominator.era}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
