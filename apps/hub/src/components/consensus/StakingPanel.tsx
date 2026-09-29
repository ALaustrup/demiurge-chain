'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, ValidatorInfo } from '@/lib/demiurge-rpc';

interface StakingPanelProps {
  address: string;
  onStake?: () => void;
}

export function StakingPanel({ address, onStake }: StakingPanelProps) {
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadValidators();
  }, []);

  const loadValidators = async () => {
    try {
      const validatorsList = await demiurgeRpc.getValidators();
      setValidators(validatorsList.filter(v => v.active));
    } catch (err: any) {
      console.error('Failed to load validators:', err);
    }
  };

  const handleNominate = async () => {
    if (!selectedValidator || !amount || !address) {
      setError('Please select a validator and enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert CGT to smallest unit (100 Sparks = 1 CGT)
      const amountInSparks = Math.floor(amountNum * 100).toString();

      // TODO: Sign transaction with user's keypair
      // For now, this is a placeholder - actual implementation needs signing
      const signature = '0x0000000000000000000000000000000000000000000000000000000000000000';

      const txHash = await demiurgeRpc.nominateValidator(
        address,
        selectedValidator,
        amountInSparks,
        signature
      );

      setSuccess(`Successfully nominated! Transaction: ${txHash.slice(0, 16)}...`);
      setAmount('');
      onStake?.();
    } catch (err: any) {
      setError(err.message || 'Failed to nominate validator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-white">Nominate Validator</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 rounded p-4 mb-4">
          <p className="text-green-200">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Validator
          </label>
          <select
            value={selectedValidator}
            onChange={(e) => setSelectedValidator(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Choose a validator...</option>
            {validators.map((validator) => (
              <option key={validator.account} value={validator.account}>
                {validator.account.slice(0, 8)}...{validator.account.slice(-8)} -{' '}
                {validator.commission}% commission
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (CGT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {selectedValidator && (
          <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Validator Info</p>
            {(() => {
              const validator = validators.find(v => v.account === selectedValidator);
              if (!validator) return null;
              return (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    Commission: <span className="text-white font-bold">{validator.commission}%</span>
                  </p>
                  <p className="text-gray-300">
                    Stake: <span className="text-white font-bold">
                      {(BigInt(validator.stake) / BigInt(100)).toString()} CGT
                    </span>
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        <button
          onClick={handleNominate}
          disabled={loading || !selectedValidator || !amount}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          {loading ? 'Nominating...' : 'Nominate Validator'}
        </button>
      </div>
    </div>
  );
}
