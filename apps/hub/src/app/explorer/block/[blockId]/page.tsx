'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { BlockDetails } from '@/lib/explorer-types';

export default function BlockDetailPage() {
  const params = useParams();
  const blockId = params.blockId as string;
  const [block, setBlock] = useState<BlockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBlock() {
      try {
        const data = await explorerService.getBlockDetails(blockId);
        if (data) {
          setBlock(data);
        } else {
          setError('Block not found');
        }
      } catch (err) {
        setError('Failed to load block');
      } finally {
        setLoading(false);
      }
    }
    loadBlock();
  }, [blockId]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading block...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !block) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-4xl mb-4">❌</p>
            <h2 className="text-xl text-white mb-2">{error || 'Block not found'}</h2>
            <Link href="/explorer" className="text-neon-cyan hover:underline">
              ← Back to Explorer
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Block #{block.number.toLocaleString()}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">📦</span>
              Block #{block.number.toLocaleString()}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono break-all">
              {block.hash}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/explorer/block/${block.number - 1}`}
              className="glass-panel px-3 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              ← Prev
            </Link>
            <Link 
              href={`/explorer/block/${block.number + 1}`}
              className="glass-panel px-3 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              Next →
            </Link>
          </div>
        </div>

        {/* Block Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overview */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Overview</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Block Height</span>
                <span className="text-white font-semibold">#{block.number.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timestamp</span>
                <span className="text-white">{formatTimestamp(block.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transactions</span>
                <span className="text-neon-cyan">{block.transactionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Era</span>
                <span className="text-white">{block.era}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  block.finalized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {block.finalized ? 'Finalized' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Technical Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <span className="text-gray-400 text-sm">Parent Hash</span>
                <p className="text-white font-mono text-xs break-all mt-1">{block.parentHash}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">State Root</span>
                <p className="text-white font-mono text-xs break-all mt-1">{block.stateRoot}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Extrinsics Root</span>
                <p className="text-white font-mono text-xs break-all mt-1">{block.extrinsicsRoot}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Block Size</span>
                <span className="text-white">{(block.size / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Energy Used / Limit</span>
                <span className="text-white">
                  {block.energyUsed.toLocaleString()} / {block.energyLimit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Validator Info */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Block Producer</p>
                <Link 
                  href={`/explorer/validator/${block.validator}`}
                  className="text-neon-cyan hover:underline font-mono"
                >
                  {block.validator}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">
              Transactions ({block.transactionCount})
            </h3>
          </div>
          {block.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                    <th className="p-3">Txn Hash</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">From</th>
                    <th className="p-3">To</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {block.transactions.map((tx) => (
                    <tr key={tx.hash} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3">
                        <Link href={`/explorer/tx/${tx.hash}`} className="text-neon-cyan hover:underline text-sm">
                          {tx.hash.slice(0, 16)}...
                        </Link>
                      </td>
                      <td className="p-3 text-gray-400 text-sm capitalize">
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className="p-3">
                        <Link href={`/explorer/address/${tx.from}`} className="text-gray-400 hover:text-white text-sm">
                          {tx.from.slice(0, 10)}...
                        </Link>
                      </td>
                      <td className="p-3">
                        {tx.to ? (
                          <Link href={`/explorer/address/${tx.to}`} className="text-gray-400 hover:text-white text-sm">
                            {tx.to.slice(0, 10)}...
                          </Link>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-white text-sm">
                        {parseFloat(tx.value).toLocaleString()} CGT
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
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
          ) : (
            <div className="p-8 text-center text-gray-500">
              No transactions in this block
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
