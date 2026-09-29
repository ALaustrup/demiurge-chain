// Demiurge Wallet Extension - Receive Screen
import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function ReceiveScreen() {
  const { setView, activeAccount, network, isAuthenticated, authUser } = useStore();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (activeAccount) {
      await navigator.clipboard.writeText(activeAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
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
        <h1 className="text-xl font-bold text-white">Receive CGT</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-demiurge-500/20 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        <p className="text-gray-400 text-sm text-center mb-6">
          Share your address below to receive CGT tokens.
        </p>

        {/* QOR ID */}
        {isAuthenticated && authUser && (
          <div className="w-full card mb-4">
            <div className="text-xs text-gray-400 mb-1">QOR ID</div>
            <div className="text-sm font-medium text-demiurge-400">{authUser.qorId}</div>
          </div>
        )}

        {/* Address Display */}
        <div className="w-full card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Your Address</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              network === 'mainnet'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {network}
            </span>
          </div>
          <div className="font-mono text-xs text-white bg-gray-900/50 rounded-lg px-3 py-3 break-all select-all">
            {activeAccount || 'No address'}
          </div>
        </div>

        {/* Copy Button */}
        <Button fullWidth onClick={copyAddress} disabled={!activeAccount}>
          <span className="flex items-center justify-center gap-2">
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Address Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Address
              </>
            )}
          </span>
        </Button>

        {/* Info */}
        <div className="mt-4 bg-gray-800/30 rounded-lg p-3 w-full">
          <p className="text-gray-500 text-xs text-center">
            Only send CGT tokens on the Demiurge {network} network to this address.
            Sending other tokens may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}
