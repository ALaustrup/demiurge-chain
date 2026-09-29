'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { ValidatorSummary, NetworkStats } from '@/lib/explorer-types';

export default function ValidatorsListPage() {
  const [validators, setValidators] = useState<ValidatorSummary[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'stake' | 'uptime' | 'nominators'>('stake');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [validatorsData, statsData] = await Promise.all([
        explorerService.getValidators(),
        explorerService.getNetworkStats(),
      ]);
      setValidators(validatorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load validators:', error);
    } finally {
      setLoading(false);
    }
  }

  const sortedValidators = [...validators].sort((a, b) => {
    switch (sortBy) {
      case 'stake':
        return parseFloat(b.stake) - parseFloat(a.stake);
      case 'uptime':
        return b.uptime - a.uptime;
      case 'nominators':
        return b.nominators - a.nominators;
      default:
        return 0;
    }
  });

  const totalStake = validators.reduce((sum, v) => sum + parseFloat(v.stake), 0);
  const activeCount = validators.filter(v => v.active).length;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Validators</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">⚡</span>
              Validators
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Active validators securing the Demiurge network
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-panel px-4 py-2 rounded-lg text-white bg-transparent border border-white/10"
            >
              <option value="stake" className="bg-dark-900">Sort by Stake</option>
              <option value="uptime" className="bg-dark-900">Sort by Uptime</option>
              <option value="nominators" className="bg-dark-900">Sort by Nominators</option>
            </select>
            <button
              onClick={loadData}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Active Validators</p>
            <p className="text-2xl font-grunge text-neon-green">{activeCount}</p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Validators</p>
            <p className="text-2xl font-grunge text-neon-cyan">{validators.length}</p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Staked</p>
            <p className="text-2xl font-grunge text-neon-purple">
              {(totalStake / 1e6).toFixed(2)}M CGT
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Staking Ratio</p>
            <p className="text-2xl font-grunge text-yellow-400">
              {stats?.stakingRatio?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        {/* Validators Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
              <p className="text-gray-400">Loading validators...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/10 bg-white/5">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Validator</th>
                    <th className="p-4">Stake</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4">Nominators</th>
                    <th className="p-4">Uptime</th>
                    <th className="p-4">Era Blocks</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedValidators.map((validator, i) => (
                    <tr key={validator.address} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-gray-400/20 text-gray-300' :
                          i === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/explorer/validator/${validator.address}`}
                          className="hover:text-neon-cyan"
                        >
                          <p className="text-white">{validator.name || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs font-mono">{validator.address.slice(0, 16)}...</p>
                        </Link>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{(parseFloat(validator.stake) / 1e6).toFixed(2)}M CGT</p>
                        <div className="w-24 h-1 bg-white/10 rounded-full mt-1">
                          <div 
                            className="h-full bg-neon-cyan rounded-full"
                            style={{ width: `${(parseFloat(validator.stake) / totalStake) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`${validator.commission <= 5 ? 'text-green-400' : validator.commission <= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {validator.commission}%
                        </span>
                      </td>
                      <td className="p-4 text-white">{validator.nominators}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            validator.uptime >= 99 ? 'bg-green-400' :
                            validator.uptime >= 95 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <span className="text-white">{validator.uptime.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{validator.blocksProducedEra}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          validator.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {validator.active ? 'Active' : 'Waiting'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
