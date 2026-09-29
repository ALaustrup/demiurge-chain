'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { TransactionSummary, TransactionType } from '@/lib/explorer-types';

export default function TransactionsListPage() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const pageSize = 25;

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const response = await explorerService.getTransactions(page, pageSize, {
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setTransactions(response.data);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const typeIcons: Record<string, string> = {
    transfer: '💸',
    stake: '🔒',
    unstake: '🔓',
    claim_reward: '🎁',
    nft_mint: '🎨',
    nft_transfer: '🖼️',
    contract_call: '📜',
    system: '⚙️',
  };

  const types: Array<TransactionType | 'all'> = [
    'all', 'transfer', 'stake', 'unstake', 'claim_reward', 'nft_mint', 'nft_transfer', 'contract_call'
  ];

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Transactions</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">💸</span>
              All Transactions
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Browse all transactions on the Demiurge blockchain
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | 'all');
                setPage(1);
              }}
              className="glass-panel px-4 py-2 rounded-lg text-white bg-transparent border border-white/10 focus:border-neon-cyan outline-none"
            >
              {types.map(type => (
                <option key={type} value={type} className="bg-dark-900">
                  {type === 'all' ? 'All Types' : type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={loadTransactions}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/10 bg-white/5">
                    <th className="p-4">Txn Hash</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">From</th>
                    <th className="p-4">To</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Age</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <Link 
                          href={`/explorer/tx/${tx.hash}`} 
                          className="text-neon-cyan hover:underline text-sm"
                        >
                          {tx.hash.slice(0, 16)}...
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-2">
                          <span>{typeIcons[tx.type] || '📄'}</span>
                          <span className="text-gray-400 text-sm capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/explorer/address/${tx.from}`}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          {tx.from.slice(0, 10)}...
                        </Link>
                      </td>
                      <td className="p-4">
                        {tx.to ? (
                          <Link 
                            href={`/explorer/address/${tx.to}`}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            {tx.to.slice(0, 10)}...
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-sm">Contract</span>
                        )}
                      </td>
                      <td className="p-4 text-white text-sm">
                        {parseFloat(tx.value).toLocaleString()} <span className="text-gray-500">CGT</span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{formatTimeAgo(tx.timestamp)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'success' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
