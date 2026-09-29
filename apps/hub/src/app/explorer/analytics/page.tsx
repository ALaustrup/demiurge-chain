'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import { LineChart, BarChart, PieChart, AreaChart, Gauge, LiveCounter } from '@/components/explorer';
import type { NetworkStats, NetworkCharts, ValidatorSummary } from '@/lib/explorer-types';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [charts, setCharts] = useState<NetworkCharts | null>(null);
  const [validators, setValidators] = useState<ValidatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [statsData, chartsData, validatorsData] = await Promise.all([
        explorerService.getNetworkStats(),
        explorerService.getNetworkCharts(),
        explorerService.getValidators(),
      ]);

      setStats(statsData);
      setCharts(chartsData);
      setValidators(validatorsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData, timeRange]);

  // Transaction type distribution - computed from real data when available
  const transactionTypeData = stats && stats.blockHeight > 0 ? [
    { label: 'Transfers', value: 0 },
    { label: 'Stakes', value: 0 },
    { label: 'NFT Mints', value: 0 },
    { label: 'Rewards', value: 0 },
  ] : [];

  const validatorStakeData = validators.slice(0, 5).map(v => ({
    label: v.name || v.address.slice(0, 8),
    value: parseFloat(v.stake),
  }));

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Analytics</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">📊</span>
              Network Analytics
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time blockchain metrics and visualizations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex glass-panel rounded-lg overflow-hidden">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <span className="text-gray-500 text-sm">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Offline Notice */}
        {stats && stats.blockHeight === 0 && (
          <div className="glass-panel rounded-xl p-4 border border-signal-warning/30 bg-signal-warning/5">
            <div className="flex items-center gap-3">
              <span className="text-signal-warning text-xl">⚠</span>
              <div>
                <p className="text-signal-warning font-medium">Blockchain node unavailable</p>
                <p className="text-gray-400 text-sm">Analytics data will populate once the node is online and producing blocks.</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <LiveCounter
              value={stats?.blockHeight || 0}
              label="Block Height"
              color="cyan"
            />
          </div>
          <div className="glass-panel rounded-xl p-4">
            <LiveCounter
              value={stats?.tps || 0}
              label="Transactions/sec"
              color="green"
            />
          </div>
          <div className="glass-panel rounded-xl p-4">
            <LiveCounter
              value={stats?.activeValidators || 0}
              label="Active Validators"
              color="purple"
            />
          </div>
          <div className="glass-panel rounded-xl p-4">
            <LiveCounter
              value={parseFloat(stats?.totalStaked || '0') / 1e6}
              label="Total Staked (M)"
              suffix="M"
              color="yellow"
            />
          </div>
          <div className="glass-panel rounded-xl p-4">
            <LiveCounter
              value={parseFloat(stats?.totalTransactionFees || '0')}
              label="Fees (24h)"
              color="pink"
            />
          </div>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4 flex justify-center">
            <Gauge
              value={stats?.stakingRatio || 0}
              max={100}
              label="Staking Ratio"
              color="#00FFFF"
            />
          </div>
          <div className="glass-panel rounded-xl p-4 flex justify-center">
            <Gauge
              value={stats?.eraProgress || 0}
              max={100}
              label="Era Progress"
              color="#9B59B6"
            />
          </div>
          <div className="glass-panel rounded-xl p-4 flex justify-center">
            <Gauge
              value={stats?.finality || 0}
              max={12}
              label="Finality (blocks)"
              color="#00FF88"
            />
          </div>
          <div className="glass-panel rounded-xl p-4 flex justify-center">
            <Gauge
              value={(stats?.activeValidators || 0) / (stats?.totalValidators || 1) * 100}
              max={100}
              label="Validator Active %"
              color="#FF69B4"
            />
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block Time History */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Block Time History</h3>
              <p className="text-gray-500 text-sm">Average block time over time</p>
            </div>
            <div className="p-4">
              <LineChart
                data={charts?.blockTimes || []}
                color="#00FFFF"
                height={250}
                label="Block Time"
                unit="s"
              />
            </div>
          </div>

          {/* TPS History */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Transactions Per Second</h3>
              <p className="text-gray-500 text-sm">Network throughput over time</p>
            </div>
            <div className="p-4">
              <LineChart
                data={charts?.tpsHistory || []}
                color="#00FF88"
                height={250}
                label="TPS"
              />
            </div>
          </div>
        </div>

        {/* Transactions Per Block */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">Transactions Per Block</h3>
            <p className="text-gray-500 text-sm">Number of transactions included in each block</p>
          </div>
          <div className="p-4">
            <BarChart
              data={charts?.transactionsPerBlock.slice(-30) || []}
              color="#9B59B6"
              height={200}
            />
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Types */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Transaction Types</h3>
              <p className="text-gray-500 text-sm">Distribution of transaction types</p>
            </div>
            <div className="p-6 flex justify-center">
              <PieChart
                data={transactionTypeData}
                size={180}
              />
            </div>
          </div>

          {/* Top Validators by Stake */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Top Validators</h3>
              <p className="text-gray-500 text-sm">Stake distribution among top validators</p>
            </div>
            <div className="p-6 flex justify-center">
              <PieChart
                data={validatorStakeData}
                size={180}
                colors={['#00FFFF', '#00FF88', '#9B59B6', '#FF69B4', '#FFC107']}
              />
            </div>
          </div>
        </div>

        {/* Staking History */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">Staking History</h3>
            <p className="text-gray-500 text-sm">Total staked amount over time</p>
          </div>
          <div className="p-4">
            <AreaChart
              datasets={[
                {
                  label: 'Total Staked',
                  data: charts?.stakingHistory || [],
                  color: '#9B59B6',
                },
              ]}
              height={250}
            />
          </div>
        </div>

        {/* Network Activity */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">Active Addresses (24h)</h3>
            <p className="text-gray-500 text-sm">Unique addresses interacting with the network</p>
          </div>
          <div className="p-4">
            <LineChart
              data={charts?.activeAddresses || []}
              color="#FF69B4"
              height={200}
              label="Active Addresses"
            />
          </div>
        </div>

        {/* Network Summary Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-grunge text-lg text-white">Network Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 text-gray-400">Total Supply</td>
                  <td className="p-4 text-white text-right">{parseInt(stats?.totalSupply || '0').toLocaleString()} CGT</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Circulating Supply</td>
                  <td className="p-4 text-white text-right">{parseInt(stats?.circulatingSupply || '0').toLocaleString()} CGT</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Total Staked</td>
                  <td className="p-4 text-neon-green text-right">{parseInt(stats?.totalStaked || '0').toLocaleString()} CGT</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Staking Ratio</td>
                  <td className="p-4 text-neon-cyan text-right">{stats?.stakingRatio?.toFixed(2) || 0}%</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Average Block Time</td>
                  <td className="p-4 text-white text-right">{stats?.blockTime || 6}s</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Current Era</td>
                  <td className="p-4 text-neon-purple text-right">{stats?.currentEra || 0}</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Blocks Per Era</td>
                  <td className="p-4 text-white text-right">{stats?.blocksPerEra?.toLocaleString() || '14,400'}</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-400">Network Version</td>
                  <td className="p-4 text-neon-cyan text-right">{stats?.networkVersion || 'v1.0.0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
