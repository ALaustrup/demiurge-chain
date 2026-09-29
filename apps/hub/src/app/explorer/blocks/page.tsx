'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { BlockSummary } from '@/lib/explorer-types';

export default function BlocksListPage() {
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    loadBlocks();
  }, [page]);

  async function loadBlocks() {
    setLoading(true);
    try {
      const response = await explorerService.getBlocks(page, pageSize);
      setBlocks(response.data);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load blocks:', error);
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Blocks</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">📦</span>
              All Blocks
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Browse all blocks on the Demiurge blockchain
            </p>
          </div>
          <button
            onClick={loadBlocks}
            className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:border-neon-cyan transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Blocks Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
              <p className="text-gray-400">Loading blocks...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/10 bg-white/5">
                    <th className="p-4">Block</th>
                    <th className="p-4">Age</th>
                    <th className="p-4">Txns</th>
                    <th className="p-4">Validator</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.hash} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <Link 
                          href={`/explorer/block/${block.number}`} 
                          className="text-neon-cyan hover:underline font-semibold"
                        >
                          #{block.number.toLocaleString()}
                        </Link>
                        <p className="text-gray-500 text-xs font-mono mt-1">
                          {block.hash.slice(0, 20)}...
                        </p>
                      </td>
                      <td className="p-4 text-gray-400">{formatTimeAgo(block.timestamp)}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded text-sm">
                          {block.transactionCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/explorer/validator/${block.validator}`}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          {block.validator.slice(0, 16)}...
                        </Link>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{formatBytes(block.size)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          block.finalized ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {block.finalized ? 'Finalized' : 'Pending'}
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
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
