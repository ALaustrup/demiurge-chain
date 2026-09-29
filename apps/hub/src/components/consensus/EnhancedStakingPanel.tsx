'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, ValidatorInfo, EraInfo } from '@/lib/demiurge-rpc';
import { qorAuth } from '@demiurge/qor-sdk';
import { generateKeypairFromQorId, generateAddressFromQorId } from '@/lib/qor-wallet';
import { signTransactionPayload } from '@/lib/wasm-wallet';
import { RewardsCalculator } from './RewardsCalculator';
import { StakingConfirmationModal } from './StakingConfirmationModal';
import { TransactionStatus } from '../wallet/TransactionStatus';

interface EnhancedStakingPanelProps {
  address: string;
  onStake?: () => void;
}

export function EnhancedStakingPanel({ address, onStake }: EnhancedStakingPanelProps) {
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [eraInfo, setEraInfo] = useState<EraInfo | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedRewards, setEstimatedRewards] = useState<{
    perEra: number;
    perDay: number;
    perYear: number;
    afterCommission: number;
  } | null>(null);

  useEffect(() => {
    loadValidators();
    loadEraInfo();
    loadBalance();
  }, [address]);

  useEffect(() => {
    calculateRewards();
  }, [selectedValidator, amount, eraInfo]);

  const loadValidators = async () => {
    try {
      const validatorsList = await demiurgeRpc.getValidators();
      setValidators(validatorsList.filter(v => v.active));
    } catch (err: any) {
      console.error('Failed to load validators:', err);
    }
  };

  const loadEraInfo = async () => {
    try {
      const era = await demiurgeRpc.getCurrentEra();
      setEraInfo(era);
    } catch (err: any) {
      console.error('Failed to load era info:', err);
    }
  };

  const loadBalance = async () => {
    try {
      const bal = await demiurgeRpc.getBalance(address);
      setBalance(bal);
    } catch (err: any) {
      console.error('Failed to load balance:', err);
    }
  };

  const calculateRewards = () => {
    if (!selectedValidator || !amount || !eraInfo || parseFloat(amount) <= 0) {
      setEstimatedRewards(null);
      return;
    }

    const stakeAmount = parseFloat(amount);
    const totalRewards = Number(BigInt(eraInfo.totalRewards)) / 100;
    const validatorStake = Number(BigInt(selectedValidator.stake)) / 100;
    const totalStake = validatorStake + stakeAmount;

    const stakeProportion = stakeAmount / totalStake;
    const grossRewardsPerEra = totalRewards * stakeProportion;
    const commissionRate = selectedValidator.commission / 100;
    const netRewardsPerEra = grossRewardsPerEra * (1 - commissionRate);

    const erasPerDay = 24;
    const erasPerYear = erasPerDay * 365;

    setEstimatedRewards({
      perEra: netRewardsPerEra,
      perDay: netRewardsPerEra * erasPerDay,
      perYear: netRewardsPerEra * erasPerYear,
      afterCommission: netRewardsPerEra,
    });
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

    const balanceNum = Number(BigInt(balance)) / 100;
    if (amountNum > balanceNum) {
      setError('Insufficient balance');
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmNomination = async () => {
    if (!selectedValidator || !amount) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowConfirmation(false);

    try {
      // Get current user
      const user = await qorAuth.getProfile();
      if (!user) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Verify address matches QOR ID
      const expectedAddress = generateAddressFromQorId(user.qor_id);
      if (expectedAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Wallet address does not match your QOR ID');
      }

      // Generate keypair from QOR ID
      const keypairJson = await generateKeypairFromQorId(user.qor_id);

      // Convert amount to smallest unit (100 Sparks = 1 CGT)
      const amountInSparks = Math.floor(parseFloat(amount) * 100).toString();

      // Create transaction payload
      // Format: { from, to, amount, nonce, call: 'nominate', data: { validator, amount } }
      const nonce = Date.now(); // TODO: Get actual nonce from chain
      const payload = {
        from: address,
        validator: selectedValidator.account,
        amount: amountInSparks,
        nonce,
        call: 'nominate',
      };

      // Sign transaction
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
      const signature = await signTransactionPayload(keypairJson, payloadBytes);

      // Submit transaction
      const hash = await demiurgeRpc.nominateValidator(
        address,
        selectedValidator.account,
        amountInSparks,
        signature
      );

      setTxHash(hash);
      setSuccess(`Successfully nominated! Transaction submitted.`);
      setAmount('');
      onStake?.();
    } catch (err: any) {
      setError(err.message || 'Failed to nominate validator');
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

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Nominate Validator</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && !txHash && (
          <div className="bg-green-900/50 border border-green-500 rounded p-4 mb-4">
            <p className="text-green-200">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Balance Display */}
          <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-white">{formatBalance(balance)} CGT</p>
          </div>

          {/* Validator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Validator
            </label>
            <select
              value={selectedValidator?.account || ''}
              onChange={(e) => {
                const validator = validators.find(v => v.account === e.target.value);
                setSelectedValidator(validator || null);
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Choose a validator...</option>
              {validators.map((validator) => (
                <option key={validator.account} value={validator.account}>
                  {formatAddress(validator.account)} - {validator.commission}% commission -{' '}
                  {formatBalance(validator.stake)} CGT stake
                </option>
              ))}
            </select>
          </div>

          {/* Validator Info */}
          {selectedValidator && (
            <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Validator Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white font-mono text-xs">{formatAddress(selectedValidator.account)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commission:</span>
                  <span className="text-white font-bold">{selectedValidator.commission}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Stake:</span>
                  <span className="text-white font-bold">{formatBalance(selectedValidator.stake)} CGT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedValidator.active
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {selectedValidator.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nomination Amount (CGT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                  setAmount(value);
                }
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={formatBalance(balance)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Max: {formatBalance(balance)} CGT
            </p>
          </div>

          {/* Rewards Calculator */}
          {selectedValidator && amount && parseFloat(amount) > 0 && (
            <RewardsCalculator
              validator={selectedValidator}
              amount={amount}
              eraInfo={eraInfo}
            />
          )}

          {/* Nominate Button */}
          <button
            onClick={handleNominate}
            disabled={loading || !selectedValidator || !amount || parseFloat(amount) <= 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            {loading ? 'Processing...' : 'Nominate Validator'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {txHash && (
        <TransactionStatus
          transactionHash={txHash}
          onFinalized={() => {
            setTxHash(null);
            loadBalance();
            loadValidators();
          }}
          onError={(err) => {
            setError(err.message);
            setTxHash(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <StakingConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmNomination}
        validator={selectedValidator}
        amount={amount}
        estimatedRewards={estimatedRewards}
        loading={loading}
      />
    </div>
  );
}
