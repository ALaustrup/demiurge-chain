'use client';

import { useState, useEffect } from 'react';
import { ValidatorInfo, EraInfo } from '@/lib/demiurge-rpc';

interface RewardsCalculatorProps {
  validator: ValidatorInfo | null;
  amount: string;
  eraInfo: EraInfo | null;
}

export function RewardsCalculator({ validator, amount, eraInfo }: RewardsCalculatorProps) {
  const [estimatedRewards, setEstimatedRewards] = useState<{
    perEra: number;
    perDay: number;
    perYear: number;
    afterCommission: number;
  } | null>(null);

  useEffect(() => {
    calculateRewards();
  }, [validator, amount, eraInfo]);

  const calculateRewards = () => {
    if (!validator || !amount || !eraInfo || parseFloat(amount) <= 0) {
      setEstimatedRewards(null);
      return;
    }

    const stakeAmount = parseFloat(amount);
    const totalRewards = Number(BigInt(eraInfo.totalRewards)) / 100; // Convert to CGT
    const validatorStake = Number(BigInt(validator.stake)) / 100; // Convert to CGT
    const totalStake = validatorStake + stakeAmount; // New total stake after nomination

    // Estimate rewards based on stake proportion
    // Assuming rewards are distributed proportionally to stake
    const stakeProportion = stakeAmount / totalStake;
    const grossRewardsPerEra = totalRewards * stakeProportion;

    // Apply commission
    const commissionRate = validator.commission / 100;
    const netRewardsPerEra = grossRewardsPerEra * (1 - commissionRate);

    // Estimate era duration (assuming ~1 hour per era, 24 eras per day)
    const erasPerDay = 24;
    const erasPerYear = erasPerDay * 365;

    setEstimatedRewards({
      perEra: netRewardsPerEra,
      perDay: netRewardsPerEra * erasPerDay,
      perYear: netRewardsPerEra * erasPerYear,
      afterCommission: netRewardsPerEra,
    });
  };

  if (!estimatedRewards || !validator) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-500/30">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Estimated Rewards</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400">Per Era</p>
          <p className="text-lg font-bold text-green-400">
            {estimatedRewards.perEra.toFixed(4)} CGT
          </p>
        </div>
        <div>
          <p className="text-gray-400">Per Day</p>
          <p className="text-lg font-bold text-green-400">
            {estimatedRewards.perDay.toFixed(4)} CGT
          </p>
        </div>
        <div>
          <p className="text-gray-400">Per Year</p>
          <p className="text-lg font-bold text-green-400">
            {estimatedRewards.perYear.toFixed(2)} CGT
          </p>
        </div>
        <div>
          <p className="text-gray-400">APY</p>
          <p className="text-lg font-bold text-green-400">
            {((estimatedRewards.perYear / parseFloat(amount)) * 100).toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-green-500/30">
        <p className="text-xs text-gray-400">
          Commission: <span className="text-white">{validator.commission}%</span> • 
          Net rewards after commission
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          ⚠️ Estimates are approximate and may vary based on validator performance
        </p>
      </div>
    </div>
  );
}
