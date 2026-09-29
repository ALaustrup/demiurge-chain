'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface NetworkMetrics {
  totalStake: string;
  activeValidators: number;
  transactionVolume: string;
  blockProductionRate: number;
  networkHealth: 'healthy' | 'degraded' | 'unhealthy';
  currentEra: number;
  blockNumber: number;
  transactionFees: string;
}

interface HistoricalData {
  timestamp: number;
  blockNumber: number;
  transactionVolume: number;
  activeValidators: number;
  totalStake: number;
}

export function NetworkAnalyticsDashboard() {
  const { getConsensusStatus, getCurrentEra, getValidators, getBlockNumber } = useBlockchain();
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadMetrics();
    loadHistoricalData();
    const interval = setInterval(() => {
      loadMetrics();
      loadHistoricalData();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [status, era, validators, blockNumber, health] = await Promise.all([
        getConsensusStatus(),
        getCurrentEra(),
        getValidators(),
        getBlockNumber(),
        demiurgeRpc.getHealth(),
      ]);

      // Calculate block production rate (blocks per second)
      const blockProductionRate = health.blockTime > 0 ? 1000 / health.blockTime : 0;

      // Determine network health
      let networkHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (validators.length < 3) {
        networkHealth = 'unhealthy';
      } else if (validators.length < 5) {
        networkHealth = 'degraded';
      }

      setMetrics({
        totalStake: status.totalStake,
        activeValidators: status.validators,
        transactionVolume: status.transactionFees,
        blockProductionRate,
        networkHealth,
        currentEra: status.currentEra,
        blockNumber: status.blockNumber,
        transactionFees: status.transactionFees,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load network metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const history = await demiurgeRpc.getNetworkHistory(timeRange);
      if (history && history.length > 0) {
        setHistoricalData(history.map((h: any) => ({
          timestamp: h.timestamp,
          blockNumber: h.blockNumber,
          transactionVolume: h.transactionVolume || 0,
          activeValidators: h.activeValidators || 0,
          totalStake: h.totalStake || 0,
        })));
      } else {
        // No historical data available - show empty
        setHistoricalData([]);
      }
    } catch (error) {
      console.warn('Could not load historical data:', error);
      setHistoricalData([]);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const exportData = () => {
    if (!metrics) return;

    const data = {
      metrics,
      historicalData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demiurge-network-analytics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getHealthColor = () => {
    if (!metrics) return 'text-gray-400';
    switch (metrics.networkHealth) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'unhealthy':
        return 'text-red-400';
    }
  };

  const getHealthBg = () => {
    if (!metrics) return 'bg-gray-900/30';
    switch (metrics.networkHealth) {
      case 'healthy':
        return 'bg-green-900/30';
      case 'degraded':
        return 'bg-yellow-900/30';
      case 'unhealthy':
        return 'bg-red-900/30';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="glass-panel rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">No network data available</p>
      </div>
    );
  }

  // Calculate chart data - handle empty arrays
  const maxVolume = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.transactionVolume)) : 1;
  const maxStake = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.totalStake)) : 1;
  const maxValidators = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.activeValidators)) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Network Analytics</h1>
          <p className="text-gray-400 mt-2">
            Real-time network statistics and trends
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={exportData}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm"
          >
            Export Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Total Stake</p>
          <p className="text-3xl font-bold text-white">
            {formatBalance(metrics.totalStake)} CGT
          </p>
          <p className="text-xs text-gray-500 mt-1">Network-wide</p>
        </div>

        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Active Validators</p>
          <p className="text-3xl font-bold text-green-400">
            {metrics.activeValidators}
          </p>
          <p className="text-xs text-gray-500 mt-1">Currently active</p>
        </div>

        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Transaction Volume</p>
          <p className="text-3xl font-bold text-yellow-400">
            {formatBalance(metrics.transactionVolume)} CGT
          </p>
          <p className="text-xs text-gray-500 mt-1">Current era fees</p>
        </div>

        <div className={`${getHealthBg()} rounded-lg p-6 border border-gray-700`}>
          <p className="text-sm text-gray-400 mb-2">Network Health</p>
          <p className={`text-3xl font-bold ${getHealthColor()}`}>
            {metrics.networkHealth.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.blockProductionRate.toFixed(2)} blocks/sec
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Transaction Volume</h2>
          {historicalData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No historical data available
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end gap-2">
                {historicalData.map((data, index) => {
                  const height = (data.transactionVolume / maxVolume) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group"
                      title={`${formatBalance(data.transactionVolume.toString())} CGT`}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t transition-all hover:from-yellow-500 hover:to-yellow-300"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Min: {formatBalance(Math.min(...historicalData.map(d => d.transactionVolume)).toString())} CGT</span>
                <span>Max: {formatBalance(Math.max(...historicalData.map(d => d.transactionVolume)).toString())} CGT</span>
              </div>
            </>
          )}
        </div>

        {/* Active Validators Chart */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Active Validators</h2>
          {historicalData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No historical data available
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end gap-2">
                {historicalData.map((data, index) => {
                  const height = (data.activeValidators / maxValidators) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group"
                      title={`${data.activeValidators} validators`}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all hover:from-green-500 hover:to-green-300"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Min: {Math.min(...historicalData.map(d => d.activeValidators))}</span>
                <span>Max: {Math.max(...historicalData.map(d => d.activeValidators))}</span>
              </div>
            </>
          )}
        </div>

        {/* Total Stake Chart */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Total Stake Trend</h2>
          {historicalData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No historical data available
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end gap-2">
                {historicalData.map((data, index) => {
                  const height = (data.totalStake / maxStake) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group"
                      title={`${formatBalance(data.totalStake.toString())} CGT`}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-500 hover:to-purple-300"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Min: {formatBalance(Math.min(...historicalData.map(d => d.totalStake)).toString())} CGT</span>
                <span>Max: {formatBalance(Math.max(...historicalData.map(d => d.totalStake)).toString())} CGT</span>
              </div>
            </>
          )}
        </div>

        {/* Network Health Metrics */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Network Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Block Production Rate</span>
                <span className="text-lg font-bold text-white">
                  {metrics.blockProductionRate.toFixed(2)} blocks/sec
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.blockProductionRate / 1) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Current Era</span>
                <span className="text-lg font-bold text-white">
                  Era {metrics.currentEra}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Block Number</span>
                <span className="text-lg font-bold text-white font-mono">
                  {metrics.blockNumber.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Health Status</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getHealthColor()} ${getHealthBg()}`}>
                  {metrics.networkHealth.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="glass-panel rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Detailed Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-300">Total Network Stake</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{formatBalance(metrics.totalStake)} CGT</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">Healthy</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-300">Active Validators</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{metrics.activeValidators}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    metrics.activeValidators >= 5 ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {metrics.activeValidators >= 5 ? 'Optimal' : 'Low'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-300">Transaction Fees (Era)</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{formatBalance(metrics.transactionFees)} CGT</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded">Active</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-300">Block Production Rate</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{metrics.blockProductionRate.toFixed(2)} blocks/sec</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">Optimal</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-300">Network Health</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{metrics.networkHealth}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    metrics.networkHealth === 'healthy' ? 'bg-green-900/50 text-green-300' :
                    metrics.networkHealth === 'degraded' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {metrics.networkHealth === 'healthy' ? 'Healthy' :
                     metrics.networkHealth === 'degraded' ? 'Degraded' : 'Unhealthy'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
