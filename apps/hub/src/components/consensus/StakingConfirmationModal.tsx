'use client';

import { ValidatorInfo } from '@/lib/demiurge-rpc';

interface StakingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validator: ValidatorInfo | null;
  amount: string;
  estimatedRewards: {
    perEra: number;
    perDay: number;
    perYear: number;
    afterCommission: number;
  } | null;
  loading?: boolean;
}

export function StakingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  validator,
  amount,
  estimatedRewards,
  loading = false,
}: StakingConfirmationModalProps) {
  if (!isOpen) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-lg border border-gray-700 max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Confirm Nomination</h2>

        <div className="space-y-4 mb-6">
          {/* Validator Info */}
          <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Validator</p>
            <p className="font-mono text-sm text-white">
              {validator ? formatAddress(validator.account) : 'N/A'}
            </p>
            {validator && (
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span>Commission: <span className="text-white">{validator.commission}%</span></span>
                <span>Stake: <span className="text-white">
                  {(Number(BigInt(validator.stake)) / 100).toLocaleString()} CGT
                </span></span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Nomination Amount</p>
            <p className="text-2xl font-bold text-white">{parseFloat(amount).toLocaleString()} CGT</p>
          </div>

          {/* Estimated Rewards */}
          {estimatedRewards && (
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded p-4 border border-green-500/30">
              <p className="text-sm text-gray-300 mb-2">Estimated Rewards</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Per Era:</span>
                  <span className="text-green-400 font-bold ml-1">
                    {estimatedRewards.perEra.toFixed(4)} CGT
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Per Day:</span>
                  <span className="text-green-400 font-bold ml-1">
                    {estimatedRewards.perDay.toFixed(4)} CGT
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-green-400 font-bold ml-1">
                    {((estimatedRewards.perYear / parseFloat(amount)) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
            <p className="text-xs text-yellow-300">
              ⚠️ Your funds will be locked until you unbond. Rewards are distributed at the end of each era.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 glass-panel py-3 px-4 rounded hover:chroma-glow transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            {loading ? 'Confirming...' : 'Confirm & Nominate'}
          </button>
        </div>
      </div>
    </div>
  );
}
