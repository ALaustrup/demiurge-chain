'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, EraInfo, ValidatorInfo, StakingPoolInfo } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface EraRewardsDisplayProps {
  address?: string;
}

interface HistoricalEraData {
  era: number;
  totalRewards: string;
  transactionFees: string;
  blockNumber: number;
}

export function EraRewardsDisplay({ address }: EraRewardsDisplayProps) {
  const { getConsensusStatus } = useBlockchain();
  const [currentEra, setCurrentEra] = useState<EraInfo | null>(null);
  const [historicalEras, setHistoricalEras] = useState<HistoricalEraData[]>([]);
  const [userRewards, setUserRewards] = useState<{
    validator: number;
    nominator: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<number | null>(null);

  useEffect(() => {
    loadEraData();
    const interval = setInterval(loadEraData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [address]);

  const loadEraData = async () => {
    try {
      setLoading(true);
      setError(null);

      const era = await demiurgeRpc.getCurrentEra();
      setCurrentEra(era);
      setSelectedEra(era.era);

      // Load user rewards if address provided
      if (address) {
        await loadUserRewards(address, era.era);
      }

      // Load historical eras (last 10 eras)
      await loadHistoricalEras(era.era);
    } catch (err: any) {
      setError(err.message || 'Failed to load era rewards');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRewards = async (userAddress: string, era: number) => {
    try {
      // Get all validators
      const validators = await demiurgeRpc.getValidators();
      let validatorRewards = 0;
      let nominatorRewards = 0;

      // Check if user is a validator
      const userValidator = validators.find(v => v.account.toLowerCase() === userAddress.toLowerCase());
      if (userValidator) {
        // User is a validator - calculate validator rewards
        const eraInfo = await demiurgeRpc.getCurrentEra();
        const totalRewards = Number(BigInt(eraInfo.totalRewards)) / 100;
        const validatorStake = Number(BigInt(userValidator.stake)) / 100;
        
        // Estimate validator reward (simplified - assumes equal distribution)
        validatorRewards = (totalRewards * 0.8) / validators.length; // 80% to validators
      }

      // Check user's nominations
      for (const validator of validators) {
        try {
          const pool = await demiurgeRpc.getStakingPool(validator.account);
          if (pool) {
            const userNomination = pool.nominators.find(n => n.account.toLowerCase() === userAddress.toLowerCase());
            if (userNomination) {
              // Calculate nominator reward
              const totalPoolStake = Number(BigInt(pool.totalStake)) / 100;
              const userStake = Number(BigInt(userNomination.stake)) / 100;
              const stakeProportion = userStake / totalPoolStake;
              
              const eraInfo = await demiurgeRpc.getCurrentEra();
              const totalRewards = Number(BigInt(eraInfo.totalRewards)) / 100;
              const validatorReward = (totalRewards * 0.8) / validators.length;
              const netReward = validatorReward * (1 - validator.commission / 100);
              
              nominatorRewards += netReward * stakeProportion;
            }
          }
        } catch {
          continue;
        }
      }

      setUserRewards({
        validator: validatorRewards,
        nominator: nominatorRewards,
        total: validatorRewards + nominatorRewards,
      });
    } catch (err) {
      console.error('Failed to load user rewards:', err);
    }
  };

  const loadHistoricalEras = async (currentEraNum: number) => {
    try {
      // Fetch real historical era data from blockchain
      const rawHistory = await demiurgeRpc.getHistoricalEras(10);
      
      if (rawHistory && rawHistory.length > 0) {
        const historical: HistoricalEraData[] = rawHistory.map((e) => ({
          era: e.era,
          totalRewards: e.total_rewards,
          transactionFees: e.transaction_fees,
          blockNumber: e.block_number,
        }));
        setHistoricalEras(historical);
      } else {
        // Fallback: only show current era if historical endpoint not available
        const eraInfo = await demiurgeRpc.getCurrentEra();
        setHistoricalEras([{
          era: eraInfo.era,
          totalRewards: eraInfo.totalRewards,
          transactionFees: eraInfo.transactionFees,
          blockNumber: eraInfo.blockNumber,
        }]);
      }
    } catch (error) {
      // Graceful fallback to current era only
      try {
        const eraInfo = await demiurgeRpc.getCurrentEra();
        setHistoricalEras([{
          era: eraInfo.era,
          totalRewards: eraInfo.totalRewards,
          transactionFees: eraInfo.transactionFees,
          blockNumber: eraInfo.blockNumber,
        }]);
      } catch {
        setHistoricalEras([]);
      }
    }
  };

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && !currentEra) {
    return (
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!currentEra) {
    return (
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">No era data available</p>
      </div>
    );
  }

  const selectedEraData = selectedEra === currentEra.era 
    ? currentEra 
    : historicalEras.find(e => e.era === selectedEra);

  return (
    <div className="space-y-6">
      {/* Current Era Rewards */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Era {currentEra.era} Rewards</h2>
          <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded text-sm font-medium">
            Current Era
          </span>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Rewards</p>
            <p className="text-2xl font-bold text-green-400">
              {formatBalance(currentEra.totalRewards)} CGT
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Transaction Fees</p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatBalance(currentEra.transactionFees)} CGT
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Validators</p>
            <p className="text-2xl font-bold text-white">
              {currentEra.validators.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Block Number</p>
            <p className="text-2xl font-bold text-white">
              {currentEra.blockNumber.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Reward Breakdown */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Reward Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Validators (80%)</span>
                <span className="text-sm font-bold text-white">
                  {formatBalance(((BigInt(currentEra.totalRewards) * BigInt(80)) / BigInt(100)).toString())} CGT
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Proposers (20%)</span>
                <span className="text-sm font-bold text-white">
                  {formatBalance(((BigInt(currentEra.totalRewards) * BigInt(20)) / BigInt(100)).toString())} CGT
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Rewards */}
      {address && userRewards && (
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Your Rewards (Era {currentEra.era})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-4 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Total Rewards</p>
              <p className="text-2xl font-bold text-green-400">
                {userRewards.total.toFixed(2)} CGT
              </p>
            </div>
            {userRewards.validator > 0 && (
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg p-4 border border-purple-500/30">
                <p className="text-sm text-gray-400 mb-1">Validator Rewards</p>
                <p className="text-2xl font-bold text-purple-400">
                  {userRewards.validator.toFixed(2)} CGT
                </p>
              </div>
            )}
            {userRewards.nominator > 0 && (
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg p-4 border border-blue-500/30">
                <p className="text-sm text-gray-400 mb-1">Nominator Rewards</p>
                <p className="text-2xl font-bold text-blue-400">
                  {userRewards.nominator.toFixed(2)} CGT
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Era Data */}
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Historical Era Data</h2>
          <select
            value={selectedEra || currentEra.era}
            onChange={(e) => setSelectedEra(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {historicalEras.map((era) => (
              <option key={era.era} value={era.era}>
                Era {era.era}
              </option>
            ))}
          </select>
        </div>

        {selectedEraData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Rewards</p>
                <p className="text-xl font-bold text-white">
                  {formatBalance(selectedEraData.totalRewards)} CGT
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Transaction Fees</p>
                <p className="text-xl font-bold text-yellow-400">
                  {formatBalance(selectedEraData.transactionFees)} CGT
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Block Number</p>
                <p className="text-xl font-bold text-white">
                  {selectedEraData.blockNumber.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Simple Chart Visualization */}
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">Reward Trends (Last 10 Eras)</p>
              <div className="flex items-end gap-2 h-32">
                {historicalEras.map((era) => {
                  const maxReward = Math.max(...historicalEras.map(e => Number(BigInt(e.totalRewards)) / 100));
                  const height = (Number(BigInt(era.totalRewards)) / 100 / maxReward) * 100;
                  const isSelected = era.era === selectedEra;
                  
                  return (
                    <div
                      key={era.era}
                      className="flex-1 flex flex-col items-center cursor-pointer group"
                      onClick={() => setSelectedEra(era.era)}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isSelected
                            ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                            : 'bg-gradient-to-t from-gray-700 to-gray-600 group-hover:from-gray-600 group-hover:to-gray-500'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`Era ${era.era}: ${formatBalance(era.totalRewards)} CGT`}
                      ></div>
                      <p className={`text-xs mt-1 ${isSelected ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                        {era.era}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
