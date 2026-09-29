// Demiurge Wallet Extension - Main Screen (Balance View)
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function MainScreen() {
  const { 
    activeAccount, 
    formattedBalance, 
    network, 
    refreshBalance,
    refreshLimits,
    setView,
    pendingRequestCount,
    isAuthenticated,
    authUser,
    accountLimits,
  } = useStore();
  
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);

  useEffect(() => {
    // Initial fetch
    refreshBalance();
    refreshLimits();
    // Refresh balance periodically
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance, refreshLimits]);

  const copyAddress = async () => {
    if (activeAccount) {
      await navigator.clipboard.writeText(activeAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimStarter = async () => {
    if (!activeAccount) return;
    setClaiming(true);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLAIM_STARTER_TOKENS',
        payload: { address: activeAccount },
      });
      
      if (response.success) {
        refreshBalance();
      }
    } catch (error) {
      console.error('Failed to claim starter tokens:', error);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {/* Pending Requests Banner */}
      {pendingRequestCount > 0 && (
        <button
          onClick={() => setView('approve')}
          className="bg-demiurge-500/20 border border-demiurge-500/30 rounded-lg p-3 mb-4 flex items-center justify-between hover:bg-demiurge-500/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-demiurge-500 rounded-full animate-pulse" />
            <span className="text-demiurge-400 text-sm font-medium">
              {pendingRequestCount} pending request{pendingRequestCount > 1 ? 's' : ''}
            </span>
          </div>
          <svg className="w-4 h-4 text-demiurge-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Auth Identity */}
      {isAuthenticated && authUser && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-6 h-6 bg-demiurge-500/20 rounded-full flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-demiurge-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-sm text-demiurge-400 font-medium">{authUser.qorId}</span>
          {accountLimits && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${
              accountLimits.tier === 'established'
                ? 'bg-green-500/20 text-green-400'
                : accountLimits.canSend
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {accountLimits.tier === 'established'
                ? 'Established'
                : accountLimits.canSend
                  ? 'Standard'
                  : 'New Account'}
            </span>
          )}
        </div>
      )}

      {/* Account Card - Full Address */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Wallet Address</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            network === 'mainnet' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {network}
          </span>
        </div>
        
        {activeAccount ? (
          <div>
            <button
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="w-full text-left group"
            >
              <div className={`font-mono text-xs text-gray-200 bg-gray-900/50 rounded-lg px-3 py-2.5 ${
                showFullAddress ? 'break-all' : 'truncate'
              } group-hover:text-white transition-colors`}>
                {activeAccount}
              </div>
            </button>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-demiurge-400 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Address</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
              >
                {showFullAddress ? 'Collapse' : 'Show full'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">No address available</div>
        )}
      </div>

      {/* Balance Card */}
      <div className="card flex flex-col items-center justify-center mb-4 py-6">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Balance</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {formattedBalance ?? '0'}
          </span>
          <span className="text-lg text-gray-400">CGT</span>
        </div>
        
        <button
          onClick={refreshBalance}
          className="mt-3 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Transfer Limits Info */}
      {accountLimits && !accountLimits.canSend && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-500/80 text-xs">
              Sending CGT is enabled after your account is 24 hours old.
              Account age: {accountLimits.accountAgeHours}h
            </p>
          </div>
        </div>
      )}

      {accountLimits && accountLimits.canSend && accountLimits.tier === 'new' && (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 mb-4">
          <p className="text-gray-400 text-xs">
            New account limits: {accountLimits.dailyUsed}/{accountLimits.dailyLimit} sends today · max {accountLimits.maxSingleCGT} CGT per transfer.
            Limits increase after 7 days.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          fullWidth 
          onClick={() => setView('send')}
          disabled={!activeAccount || (accountLimits ? !accountLimits.canSend : false)}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </span>
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setView('receive')} disabled={!activeAccount}>
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Receive
          </span>
        </Button>
      </div>

      {/* Claim Starter (for testnet) */}
      {network !== 'mainnet' && activeAccount && (
        <Button 
          fullWidth 
          variant="ghost" 
          className="mt-3"
          loading={claiming}
          onClick={handleClaimStarter}
        >
          Claim Starter Tokens
        </Button>
      )}
    </div>
  );
}
