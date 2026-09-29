// Demiurge Wallet Extension - Send Screen (with Transfer Policy)
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function SendScreen() {
  const { sendTransaction, setView, isLoading, formattedBalance, activeAccount, accountLimits, refreshLimits } = useStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [policyWarning, setPolicyWarning] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    refreshLimits();
  }, [refreshLimits]);

  const validateAddress = (address: string): boolean => {
    // Demiurge addresses: 48-char hex strings starting with 5, or 64-char hex public keys
    return /^[0-9a-fA-F]{64}$/.test(address) || /^5[0-9a-fA-F]{47}$/.test(address);
  };

  // Pre-check transfer policy when recipient and amount are filled
  useEffect(() => {
    setPolicyWarning('');
    if (!recipient || !amount || !validateAddress(recipient)) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const amountInBaseUnits = (BigInt(Math.floor(amountNum * 1e6)) * BigInt(1e12)).toString();

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CHECK_TRANSFER_POLICY',
          payload: { to: recipient, amount: amountInBaseUnits },
        });

        if (response.success && response.data && !response.data.allowed) {
          setPolicyWarning(response.data.reason || 'Transfer not allowed.');
        }
      } catch {
        // Ignore pre-check errors
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [recipient, amount]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAddress(recipient)) {
      setError('Invalid recipient address. Must be a valid Demiurge address.');
      return;
    }

    if (activeAccount && recipient.toLowerCase() === activeAccount.toLowerCase()) {
      setError('Cannot send CGT to your own address.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (amountNum < 0.001) {
      setError('Minimum transfer amount is 0.001 CGT.');
      return;
    }

    // Convert to base units (18 decimals)
    const amountInBaseUnits = (BigInt(Math.floor(amountNum * 1e6)) * BigInt(1e12)).toString();

    try {
      await sendTransaction(recipient, amountInBaseUnits);
      refreshLimits();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleMaxAmount = () => {
    if (formattedBalance) {
      // Leave 0.1 CGT for energy + minimum retain
      const max = Math.max(0, parseFloat(formattedBalance) - 0.1);
      setAmount(max > 0 ? max.toFixed(6) : '0');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('main')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Send CGT</h1>
      </div>

      {/* Limits Banner */}
      {accountLimits && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 mb-4 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Daily sends</span>
            <span className="text-white">{accountLimits.dailyUsed}/{accountLimits.dailyLimit}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Max per transfer</span>
            <span className="text-white">{accountLimits.maxSingleCGT} CGT</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Recipient */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="Demiurge address"
              className="input font-mono text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm">Amount</label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-demiurge-400 text-xs hover:text-demiurge-300 transition-colors"
              >
                Max: {formattedBalance ?? '0'}
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                CGT
              </span>
            </div>
          </div>

          {/* Policy Warning */}
          {policyWarning && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 text-xs">{policyWarning}</p>
              </div>
            </div>
          )}

          {/* Transaction Preview */}
          {amount && recipient && !policyWarning && (
            <div className="card">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-medium">{amount} CGT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Fee</span>
                  <span className="text-white">~0.001 CGT</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-bold">
                      {(parseFloat(amount || '0') + 0.001).toFixed(6)} CGT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => setView('main')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={isLoading || checking}
            disabled={!recipient || !amount || !!policyWarning}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
