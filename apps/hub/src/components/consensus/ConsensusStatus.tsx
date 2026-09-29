'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

export function ConsensusStatus() {
  const [status, setStatus] = useState<{
    currentEra: number;
    blockNumber: number;
    validators: number;
    totalStake: string;
    transactionFees: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await demiurgeRpc.getConsensusStatus();
      // Validate data structure before setting
      if (data && typeof data.blockNumber === 'number') {
        setStatus(data);
      }
    } catch (err: any) {
      // Silently handle network/RPC errors (blockchain may not be running)
      // Don't log network errors - they're expected when blockchain is offline
      if (!err?.isNetworkError && err?.message && !err.message.includes('fetch') && !err.message.includes('RPC unavailable')) {
        console.warn('Blockchain RPC error:', err.message);
      }
      // Don't set error state - component will show offline state
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Blockchain</span>
          <span className="text-gray-600">Offline</span>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <span className="text-gray-500 font-medium">Disconnected</span>
        </div>
      </div>
    );
  }

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-gray-400">Era</span>
        <span className="font-bold text-white">{status.currentEra}</span>
      </div>
      <div className="h-4 w-px bg-gray-600"></div>
      <div className="flex items-center gap-1">
        <span className="text-gray-400">Block</span>
        <span className="font-bold text-white font-mono">{(status.blockNumber ?? 0).toLocaleString()}</span>
      </div>
      <div className="h-4 w-px bg-gray-600"></div>
      <div className="flex items-center gap-1">
        <span className="text-gray-400">Validators</span>
        <span className="font-bold text-green-400">{status.validators}</span>
      </div>
      <div className="flex items-center gap-1.5 ml-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-400 font-medium">Live</span>
      </div>
    </div>
  );
}
