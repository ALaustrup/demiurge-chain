'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { TransactionDetails } from '@/lib/explorer-types';

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [tx, setTx] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTx() {
      try {
        const data = await explorerService.getTransactionDetails(hash);
        if (data) {
          setTx(data);
        } else {
          setError('Transaction not found');
        }
      } catch (err) {
        setError('Failed to load transaction');
      } finally {
        setLoading(false);
      }
    }
    loadTx();
  }, [hash]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading transaction...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !tx) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-4xl mb-4">❌</p>
            <h2 className="text-xl text-white mb-2">{error || 'Transaction not found'}</h2>
            <Link href="/explorer" className="text-neon-cyan hover:underline">
              ← Back to Explorer
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

  const typeIcons: Record<string, string> = {
    transfer: '💸',
    stake: '🔒',
    unstake: '🔓',
    claim_reward: '🎁',
    nft_mint: '🎨',
    nft_transfer: '🖼️',
    contract_call: '📜',
    contract_create: '🏗️',
    system: '⚙️',
    governance: '🏛️',
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Transaction</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
            <span className="text-neon-cyan">{typeIcons[tx.type] || '💸'}</span>
            Transaction Details
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-mono break-all">
            {tx.hash}
          </p>
        </div>

        {/* Status Banner */}
        <div className={`glass-panel rounded-xl p-4 border ${
          tx.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
          tx.status === 'failed' ? 'border-red-500/30 bg-red-500/5' :
          'border-yellow-500/30 bg-yellow-500/5'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              tx.status === 'success' ? 'bg-green-500/20' :
              tx.status === 'failed' ? 'bg-red-500/20' :
              'bg-yellow-500/20'
            }`}>
              {tx.status === 'success' ? '✓' : tx.status === 'failed' ? '✗' : '⏳'}
            </div>
            <div>
              <p className={`text-lg font-semibold ${
                tx.status === 'success' ? 'text-green-400' :
                tx.status === 'failed' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {tx.status === 'success' ? 'Transaction Successful' :
                 tx.status === 'failed' ? 'Transaction Failed' :
                 'Transaction Pending'}
              </p>
              <p className="text-gray-400 text-sm">
                {tx.confirmations} confirmations
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overview */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Overview</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-white capitalize flex items-center gap-2">
                  <span>{typeIcons[tx.type]}</span>
                  {tx.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Block</span>
                <Link href={`/explorer/block/${tx.blockNumber}`} className="text-neon-cyan hover:underline">
                  #{tx.blockNumber.toLocaleString()}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timestamp</span>
                <span className="text-white">{formatTimestamp(tx.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Value</span>
                <span className="text-neon-green font-semibold">
                  {parseFloat(tx.value).toLocaleString()} CGT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction Fee</span>
                <span className="text-white">{tx.fee} CGT</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Addresses</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <span className="text-gray-400 text-sm">From</span>
                <Link 
                  href={`/explorer/address/${tx.from}`}
                  className="block text-neon-cyan hover:underline font-mono text-sm mt-1 break-all"
                >
                  {tx.from}
                </Link>
              </div>
              <div className="flex justify-center">
                <span className="text-2xl">↓</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">To</span>
                {tx.to ? (
                  <Link 
                    href={`/explorer/address/${tx.to}`}
                    className="block text-neon-cyan hover:underline font-mono text-sm mt-1 break-all"
                  >
                    {tx.to}
                  </Link>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">Contract Creation</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Energy Details */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">Energy Details</h3>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-gray-400 text-sm">Energy Used</span>
              <p className="text-white font-semibold">{tx.energyUsed.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Energy Limit</span>
              <p className="text-white font-semibold">{tx.energyLimit.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Energy Price</span>
              <p className="text-white font-semibold">{(parseFloat(tx.energyPrice) / 1e9).toFixed(2)} units</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Nonce</span>
              <p className="text-white font-semibold">{tx.nonce}</p>
            </div>
          </div>
        </div>

        {/* Input Data */}
        {tx.input && tx.input !== '0x' && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Input Data</h3>
            </div>
            <div className="p-4">
              <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto text-xs text-gray-400 font-mono">
                {tx.input}
              </pre>
            </div>
          </div>
        )}

        {/* Token Transfers */}
        {tx.tokenTransfers && tx.tokenTransfers.length > 0 && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Token Transfers</h3>
            </div>
            <div className="divide-y divide-white/5">
              {tx.tokenTransfers.map((transfer, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">🪙</span>
                    <div>
                      <p className="text-white">{transfer.tokenSymbol}</p>
                      <p className="text-gray-400 text-sm">
                        {transfer.from.slice(0, 10)}... → {transfer.to.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-neon-green">
                    {parseFloat(transfer.value).toLocaleString()} {transfer.tokenSymbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
