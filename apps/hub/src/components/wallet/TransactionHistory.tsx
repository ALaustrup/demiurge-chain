'use client';

import { useEffect, useState, useMemo } from 'react';
import { blockchainClient } from '@/lib/blockchain';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
  timestamp?: number;
  type?: 'transfer' | 'reward' | 'spend';
  reason?: string;
}

interface TransactionHistoryProps {
  address: string;
}

type SortField = 'date' | 'amount' | 'block';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'transfer' | 'reward' | 'spend';

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchHash, setSearchHash] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!address) return;

      setLoading(true);
      setError(null);
      try {
        // Query real transaction history from blockchain
        const realTxs = await blockchainClient.getTransactions(address);
        const history: Transaction[] = realTxs.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          blockNumber: tx.blockNumber,
          timestamp: Date.now() - (227000 - tx.blockNumber) * 2000, // Estimate based on 2s blocks
          type: 'transfer' as const
        }));
        
        setTransactions(history);
      } catch (err: any) {
        // Show empty state if no transactions, not mock data
        console.warn('No transaction history available:', err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [address]);

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by hash search
    if (searchHash) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchHash.toLowerCase())
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          const aTime = a.timestamp || 0;
          const bTime = b.timestamp || 0;
          comparison = aTime - bTime;
          break;
        case 'amount':
          comparison = BigInt(a.amount) > BigInt(b.amount) ? 1 : -1;
          break;
        case 'block':
          comparison = a.blockNumber - b.blockNumber;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, filterType, searchHash, sortField, sortOrder]);

  // Paginate
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type?: string) => {
    switch (type) {
      case 'reward': return 'text-green-400';
      case 'spend': return 'text-red-400';
      case 'transfer': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getTransactionTypeLabel = (type?: string) => {
    switch (type) {
      case 'reward': return 'Reward';
      case 'spend': return 'Spend';
      case 'transfer': return 'Transfer';
      default: return 'Transfer';
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-demiurge-cyan"></div>
        <p className="mt-2">Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by transaction hash..."
            value={searchHash}
            onChange={(e) => {
              setSearchHash(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full glass-panel px-4 py-2 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as FilterType);
            setCurrentPage(1);
          }}
          className="glass-panel px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
        >
          <option value="all">All Types</option>
          <option value="transfer">Transfers</option>
          <option value="reward">Rewards</option>
          <option value="spend">Spends</option>
        </select>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400">Sort by:</span>
        <select
          value={sortField}
          onChange={(e) => {
            setSortField(e.target.value as SortField);
            setCurrentPage(1);
          }}
          className="glass-panel px-3 py-1 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="block">Block</option>
        </select>
        <button
          onClick={() => {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            setCurrentPage(1);
          }}
          className="glass-panel px-3 py-1 rounded hover:chroma-glow transition-all text-sm"
        >
          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
        <span className="text-gray-400 ml-auto">
          {filteredAndSorted.length} transaction{filteredAndSorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Transaction List */}
      {paginatedTransactions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No transactions found.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTransactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${getTransactionTypeColor(tx.type)}`}>
                      {getTransactionTypeLabel(tx.type)}
                    </span>
                    {tx.reason && (
                      <span className="text-xs text-gray-500">• {tx.reason}</span>
                    )}
                  </div>
                  <div className="font-mono text-sm text-white">
                    {tx.from === address ? (
                      <>To: <span className="text-demiurge-cyan">{formatAddress(tx.to)}</span></>
                    ) : (
                      <>From: <span className="text-demiurge-cyan">{formatAddress(tx.from)}</span></>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Block #{tx.blockNumber}</span>
                    {tx.timestamp && (
                      <>
                        <span>•</span>
                        <span>{formatDate(tx.timestamp)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono">{tx.hash.slice(0, 8)}...</span>
                  </div>
                </div>
                <div className={`text-lg font-bold ${tx.from === address ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.from === address ? '-' : '+'} {blockchainClient.formatCGTBalance(tx.amount)} CGT
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-400 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
