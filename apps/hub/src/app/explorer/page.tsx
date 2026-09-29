'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { explorerService, getWebSocketUrl } from '@/lib/explorer-service';
import { useNewBlocks, useNewTransactions, useRealtimeStats } from '@/hooks/useBlockchainSubscriptions';
import type { 
  NetworkStats, 
  NetworkCharts, 
  BlockSummary, 
  TransactionSummary,
  ValidatorSummary,
  SearchResult,
} from '@/lib/explorer-types';

// Simple line chart component
function MiniChart({ 
  data, 
  color = '#00FFFF', 
  height = 60,
  showLabels = false,
}: { 
  data: { timestamp: number; value: number }[]; 
  color?: string; 
  height?: number;
  showLabels?: boolean;
}) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500 text-xs">No data</div>;
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height }} className="relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon 
          points={`0,100 ${points} 100,100`} 
          fill={`url(#gradient-${color.replace('#', '')})`} 
        />
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="1.5" 
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {showLabels && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          <span>{min.toFixed(1)}</span>
          <span>{max.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

// Stat card component
function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  chart,
  color = 'cyan',
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: string; 
  chart?: { timestamp: number; value: number }[];
  color?: 'cyan' | 'green' | 'purple' | 'yellow' | 'pink';
}) {
  const colors = {
    cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan/30', bg: 'bg-neon-cyan/10' },
    green: { text: 'text-neon-green', border: 'border-neon-green/30', bg: 'bg-neon-green/10' },
    purple: { text: 'text-neon-purple', border: 'border-neon-purple/30', bg: 'bg-neon-purple/10' },
    yellow: { text: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
    pink: { text: 'text-neon-pink', border: 'border-neon-pink/30', bg: 'bg-neon-pink/10' },
  };

  const c = colors[color];

  return (
    <div className={`glass-panel rounded-xl p-4 border ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-grunge ${c.text}`}>{value}</p>
          {change && (
            <p className={`text-xs ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      {chart && chart.length > 0 && (
        <MiniChart 
          data={chart} 
          color={c.text.replace('text-', '').replace('neon-', '#').replace('yellow-400', '#FFC107').replace('cyan', '#00FFFF').replace('green', '#00FF88').replace('purple', '#9B59B6').replace('pink', '#FF69B4')} 
          height={50} 
        />
      )}
    </div>
  );
}

// Search component
function ExplorerSearch({ onSearch }: { onSearch: (results: SearchResult[]) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await explorerService.search(query);
      setResults(searchResults);
      onSearch(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Block / Tx Hash / Address..."
            className="w-full glass-panel px-4 py-3 pl-12 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan border border-white/10"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="neon-button px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </div>
      
      {/* Search Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-lg border border-white/10 z-50 max-h-80 overflow-y-auto">
          {results.map((result, i) => (
            <Link
              key={`${result.type}-${result.id}-${i}`}
              href={result.link}
              className="block p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
              onClick={() => setResults([])}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {result.type === 'block' && '📦'}
                  {result.type === 'transaction' && '💸'}
                  {result.type === 'address' && '👤'}
                  {result.type === 'validator' && '⚡'}
                </span>
                <div>
                  <p className="text-white text-sm">{result.title}</p>
                  <p className="text-gray-500 text-xs">{result.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}

// Recent blocks table
function RecentBlocks({ blocks }: { blocks: BlockSummary[] }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-grunge text-lg text-white">Recent Blocks</h3>
        <Link href="/explorer/blocks" className="text-neon-cyan text-sm hover:underline">
          View All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-white/5">
              <th className="p-3">Block</th>
              <th className="p-3">Age</th>
              <th className="p-3">Txns</th>
              <th className="p-3">Validator</th>
              <th className="p-3">Size</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.hash} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <Link href={`/explorer/block/${block.number}`} className="text-neon-cyan hover:underline">
                    #{block.number.toLocaleString()}
                  </Link>
                </td>
                <td className="p-3 text-gray-400 text-sm">
                  {formatTimeAgo(block.timestamp)}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded text-sm">
                    {block.transactionCount}
                  </span>
                </td>
                <td className="p-3">
                  <Link href={`/explorer/validator/${block.validator}`} className="text-gray-400 hover:text-white text-sm">
                    {block.validator.slice(0, 12)}...
                  </Link>
                </td>
                <td className="p-3 text-gray-400 text-sm">
                  {formatBytes(block.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Recent transactions table
function RecentTransactions({ transactions }: { transactions: TransactionSummary[] }) {
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

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-grunge text-lg text-white">Recent Transactions</h3>
        <Link href="/explorer/transactions" className="text-neon-cyan text-sm hover:underline">
          View All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-white/5">
              <th className="p-3">Hash</th>
              <th className="p-3">Type</th>
              <th className="p-3">From</th>
              <th className="p-3">To</th>
              <th className="p-3">Value</th>
              <th className="p-3">Age</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.hash} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <Link href={`/explorer/tx/${tx.hash}`} className="text-neon-cyan hover:underline text-sm">
                    {tx.hash.slice(0, 10)}...
                  </Link>
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-1">
                    <span>{typeIcons[tx.type] || '📄'}</span>
                    <span className="text-gray-400 text-sm capitalize">{tx.type.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="p-3">
                  <Link href={`/explorer/address/${tx.from}`} className="text-gray-400 hover:text-white text-sm">
                    {tx.from.slice(0, 8)}...
                  </Link>
                </td>
                <td className="p-3">
                  {tx.to ? (
                    <Link href={`/explorer/address/${tx.to}`} className="text-gray-400 hover:text-white text-sm">
                      {tx.to.slice(0, 8)}...
                    </Link>
                  ) : (
                    <span className="text-gray-500 text-sm">-</span>
                  )}
                </td>
                <td className="p-3 text-white text-sm">
                  {parseFloat(tx.value).toLocaleString()} <span className="text-gray-500">CGT</span>
                </td>
                <td className="p-3 text-gray-400 text-sm">
                  {formatTimeAgo(tx.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Validators summary
function ValidatorsSummary({ validators }: { validators: ValidatorSummary[] }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-grunge text-lg text-white">Top Validators</h3>
        <Link href="/explorer/validators" className="text-neon-cyan text-sm hover:underline">
          View All →
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {validators.slice(0, 5).map((validator, i) => (
          <div key={validator.address} className="p-3 flex items-center gap-3 hover:bg-white/5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              i === 1 ? 'bg-gray-400/20 text-gray-300' :
              i === 2 ? 'bg-orange-500/20 text-orange-400' :
              'bg-white/5 text-gray-400'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/explorer/validator/${validator.address}`} className="text-white hover:text-neon-cyan text-sm truncate block">
                {validator.name || validator.address.slice(0, 16)}...
              </Link>
              <p className="text-gray-500 text-xs">{validator.nominators} nominators</p>
            </div>
            <div className="text-right">
              <p className="text-neon-green text-sm">{parseFloat(validator.stake).toLocaleString()} CGT</p>
              <p className="text-gray-500 text-xs">{validator.commission}% fee</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${validator.active ? 'bg-green-400' : 'bg-gray-500'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility functions
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

// Main Explorer Page
export default function ExplorerPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [charts, setCharts] = useState<NetworkCharts | null>(null);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [validators, setValidators] = useState<ValidatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [useRealtime, setUseRealtime] = useState(true);

  // WebSocket URL for subscriptions
  const wsUrl = useMemo(() => getWebSocketUrl(), []);
  
  // Real-time subscriptions
  const { blocks: realtimeBlocks, status: blocksStatus } = useNewBlocks(wsUrl, 10);
  const { transactions: realtimeTxs, status: txStatus } = useNewTransactions(wsUrl, 10);
  const { blockHeight, tps, blockTime, status: statsStatus } = useRealtimeStats(wsUrl);
  
  // Determine if we're connected to real-time data
  const isRealtimeConnected = blocksStatus === 'connected';

  const loadData = useCallback(async () => {
    try {
      const [statsData, chartsData, blocksData, txData, validatorsData] = await Promise.all([
        explorerService.getNetworkStats(),
        explorerService.getNetworkCharts(),
        explorerService.getRecentBlocks(10),
        explorerService.getRecentTransactions(10),
        explorerService.getValidators(),
      ]);

      setStats(statsData);
      setCharts(chartsData);
      
      // Only use polled data if not connected to real-time
      if (!isRealtimeConnected || !useRealtime) {
        setBlocks(blocksData);
        setTransactions(txData);
      }
      
      setValidators(validatorsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load explorer data:', error);
    } finally {
      setLoading(false);
    }
  }, [isRealtimeConnected, useRealtime]);

  // Merge real-time data with polled data
  useEffect(() => {
    if (useRealtime && isRealtimeConnected && realtimeBlocks.length > 0) {
      setBlocks(prev => {
        // Merge realtime blocks with existing, dedupe by number
        const merged = [...realtimeBlocks];
        prev.forEach(b => {
          if (!merged.find(m => m.number === b.number)) {
            merged.push(b);
          }
        });
        return merged.sort((a, b) => b.number - a.number).slice(0, 10);
      });
      setLastUpdate(new Date());
    }
  }, [realtimeBlocks, isRealtimeConnected, useRealtime]);

  useEffect(() => {
    if (useRealtime && isRealtimeConnected && realtimeTxs.length > 0) {
      setTransactions(prev => {
        const merged = [...realtimeTxs];
        prev.forEach(t => {
          if (!merged.find(m => m.hash === t.hash)) {
            merged.push(t);
          }
        });
        return merged.slice(0, 10);
      });
    }
  }, [realtimeTxs, isRealtimeConnected, useRealtime]);

  // Update stats with real-time data
  useEffect(() => {
    if (useRealtime && isRealtimeConnected && blockHeight > 0) {
      setStats(prev => prev ? {
        ...prev,
        blockHeight,
        tps: tps || prev.tps,
        blockTime: blockTime || prev.blockTime,
      } : prev);
    }
  }, [blockHeight, tps, blockTime, isRealtimeConnected, useRealtime]);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds when using real-time, 10 seconds otherwise
    const interval = setInterval(loadData, useRealtime && isRealtimeConnected ? 30000 : 10000);
    return () => clearInterval(interval);
  }, [loadData, useRealtime, isRealtimeConnected]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading explorer data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">⛓️</span>
              Block Explorer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time blockchain analytics and explorer
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Real-time toggle */}
            <button
              onClick={() => setUseRealtime(!useRealtime)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                useRealtime 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                useRealtime && isRealtimeConnected 
                  ? 'bg-neon-cyan animate-pulse' 
                  : useRealtime 
                    ? 'bg-yellow-400' 
                    : 'bg-gray-500'
              }`} />
              {useRealtime ? 'Live' : 'Polling'}
            </button>
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                stats?.blockHeight 
                  ? isRealtimeConnected 
                    ? 'bg-green-400 animate-pulse' 
                    : 'bg-green-400'
                  : 'bg-red-400'
              }`} />
              <span className="text-gray-400 text-sm">
                {stats?.blockHeight 
                  ? isRealtimeConnected 
                    ? 'Live' 
                    : 'Connected' 
                  : 'Offline'}
              </span>
            </div>
            <span className="text-gray-500 text-sm">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Search */}
        <ExplorerSearch onSearch={() => {}} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Block Height"
            value={formatNumber(stats?.blockHeight || 0)}
            icon="📦"
            color="cyan"
            chart={charts?.transactionsPerBlock}
          />
          <StatCard
            title="Current Era"
            value={stats?.currentEra || 0}
            icon="🔄"
            color="purple"
          />
          <StatCard
            title="TPS"
            value={stats?.tps?.toFixed(2) || '0'}
            change="+12%"
            icon="⚡"
            color="green"
            chart={charts?.tpsHistory}
          />
          <StatCard
            title="Block Time"
            value={`${stats?.blockTime || 6}s`}
            icon="⏱️"
            color="yellow"
            chart={charts?.blockTimes}
          />
          <StatCard
            title="Validators"
            value={stats?.activeValidators || 0}
            icon="👥"
            color="pink"
          />
          <StatCard
            title="Total Staked"
            value={formatNumber(stats?.totalStaked || '0')}
            icon="🔒"
            color="green"
            chart={charts?.stakingHistory}
          />
        </div>

        {/* Network Health */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-grunge text-lg text-white mb-4">Network Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Finality</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-green rounded-full"
                    style={{ width: `${Math.min(100, (stats?.finality || 0) / 12 * 100)}%` }}
                  />
                </div>
                <span className="text-white text-sm">{stats?.finality || 0} blocks</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Era Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full"
                    style={{ width: `${stats?.eraProgress || 0}%` }}
                  />
                </div>
                <span className="text-white text-sm">{(stats?.eraProgress || 0).toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Staking Ratio</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    style={{ width: `${stats?.stakingRatio || 0}%` }}
                  />
                </div>
                <span className="text-white text-sm">{(stats?.stakingRatio || 0).toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Supply</p>
              <p className="text-white font-semibold">{formatNumber(stats?.totalSupply || '0')} CGT</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Circulating</p>
              <p className="text-white font-semibold">{formatNumber(stats?.circulatingSupply || '0')} CGT</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Blocks & Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <RecentBlocks blocks={blocks} />
            <RecentTransactions transactions={transactions} />
          </div>
          
          {/* Validators */}
          <div className="space-y-6">
            <ValidatorsSummary validators={validators} />
            
            {/* Quick Stats */}
            <div className="glass-panel rounded-xl p-4 space-y-4">
              <h3 className="font-grunge text-lg text-white">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Fees (24h)</span>
                  <span className="text-white">{formatNumber(stats?.totalTransactionFees || '0')} CGT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Version</span>
                  <span className="text-neon-cyan">{stats?.networkVersion || 'v1.0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Blocks per Era</span>
                  <span className="text-white">{stats?.blocksPerEra?.toLocaleString() || '14,400'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg TPS (24h)</span>
                  <span className="text-neon-green">{stats?.avgTps24h?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
