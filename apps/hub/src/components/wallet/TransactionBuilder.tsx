'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DemiurgeClient } from '@demiurge/sdk';
import { sendCGT, estimateFee } from '@/lib/transaction-builder';
import { TransactionStatus } from './TransactionStatus';

interface TransactionBuilderProps {
  fromAddress: string;
  onSuccess?: (txHash: string) => void;
  onCancel?: () => void;
}

export function TransactionBuilder({ fromAddress, onSuccess, onCancel }: TransactionBuilderProps) {
  const { user } = useAuth();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedEnergy, setEstimatedEnergy] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Validate inputs
      if (!toAddress || !amount) {
        throw new Error('Recipient address and amount required');
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      // Estimate fee
      const fee = await estimateFee({ type: 'transfer', to: toAddress, amount: (amountNum * 100).toString() });
      setEstimatedEnergy(fee.energy);

      // Build, sign, and submit transaction
      const hash = await sendCGT(user, toAddress, amount);
      
      setTxHash(hash);
      setSuccess(true);
      
      // Clear form
      setToAddress('');
      setAmount('');
      setMemo('');
      
      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-grunge text-white mb-4">Send CGT</h3>
        <p className="text-sm text-gray-400 mb-6">
          Transfer CGT tokens to another address on the Demiurge blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From Address (Display Only) */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">From</label>
          <div className="glass-panel p-3 rounded-lg border border-white/10">
            <div className="font-mono text-sm text-gray-300 truncate">{fromAddress}</div>
          </div>
        </div>

        {/* To Address */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">To Address *</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white font-mono text-sm"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (CGT) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100.00"
            className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white text-lg"
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            ≈ {amount ? (parseFloat(amount) * 100).toFixed(0) : '0'} Sparks
          </div>
        </div>

        {/* Memo (Optional) */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Memo (Optional)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Payment for services"
            maxLength={128}
            className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
          />
        </div>

        {/* Transaction Status */}
        {success && txHash && (
          <TransactionStatus 
            txHash={txHash} 
            onConfirmed={() => {
              // Optionally refresh balance or show success message
            }}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Energy Cost */}
        <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Transaction Cost:</span>
            <span className="text-neon-cyan font-bold">{estimatedEnergy} Energy (0 CGT fees)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !toAddress || !amount}
            className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-cyan/70 text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Send CGT'}
          </button>
        </div>
      </form>
    </div>
  );
}
