'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { ValidatorDetails } from '@/lib/explorer-types';

export default function ValidatorDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const [validator, setValidator] = useState<ValidatorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadValidator() {
      try {
        const data = await explorerService.getValidatorDetails(address);
        if (data) {
          setValidator(data);
        } else {
          setError('Validator not found');
        }
      } catch (err) {
        setError('Failed to load validator');
      } finally {
        setLoading(false);
      }
    }
    loadValidator();
  }, [address]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading validator...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !validator) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-4xl mb-4">❌</p>
            <h2 className="text-xl text-white mb-2">{error || 'Validator not found'}</h2>
            <Link href="/explorer/validators" className="text-neon-cyan hover:underline">
              ← Back to Validators
            </Link>
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
          <Link href="/explorer/validators" className="text-gray-400 hover:text-white">Validators</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">{validator.name || address.slice(0, 12)}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-4xl">
            ⚡
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-grunge text-white">
                {validator.name || 'Unknown Validator'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                validator.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {validator.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-400 font-mono text-sm mt-2 break-all">{validator.address}</p>
            {validator.identity && (
              <div className="flex items-center gap-4 mt-3">
                {validator.identity.web && (
                  <a href={validator.identity.web} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline text-sm">
                    🌐 Website
                  </a>
                )}
                {validator.identity.twitter && (
                  <a href={`https://twitter.com/${validator.identity.twitter}`} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline text-sm">
                    🐦 @{validator.identity.twitter}
                  </a>
                )}
                {validator.identity.email && (
                  <a href={`mailto:${validator.identity.email}`} className="text-neon-cyan hover:underline text-sm">
                    ✉️ Email
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link 
              href={`/explorer/address/${validator.address}`}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              View Address
            </Link>
            <button
              onClick={() => navigator.clipboard.writeText(validator.address)}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Stake</p>
            <p className="text-2xl font-grunge text-neon-green">
              {(parseFloat(validator.stake) / 1e6).toFixed(2)}M
              <span className="text-sm text-gray-400 ml-1">CGT</span>
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Commission</p>
            <p className={`text-2xl font-grunge ${
              validator.commission <= 5 ? 'text-green-400' :
              validator.commission <= 10 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {validator.commission}%
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Nominators</p>
            <p className="text-2xl font-grunge text-neon-cyan">{validator.nominators}</p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Uptime</p>
            <p className="text-2xl font-grunge text-white">{validator.uptime.toFixed(2)}%</p>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stake Breakdown */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Stake Breakdown</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Self Stake</span>
                  <span className="text-white">{(parseFloat(validator.selfStake) / 1e6).toFixed(2)}M CGT</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-purple rounded-full"
                    style={{ width: `${(parseFloat(validator.selfStake) / parseFloat(validator.stake)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Nominator Stake</span>
                  <span className="text-white">{(parseFloat(validator.nominatorStake) / 1e6).toFixed(2)}M CGT</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-cyan rounded-full"
                    style={{ width: `${(parseFloat(validator.nominatorStake) / parseFloat(validator.stake)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-grunge text-lg text-white">Performance</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Blocks Produced (Era)</span>
                <span className="text-neon-green">{validator.blocksProducedEra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Blocks Produced (Total)</span>
                <span className="text-white">{validator.blocksProduced.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Missed Blocks</span>
                <span className={validator.missedBlocks > 0 ? 'text-red-400' : 'text-green-400'}>
                  {validator.missedBlocks}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rewards (24h)</span>
                <span className="text-neon-green">{parseFloat(validator.rewards24h).toLocaleString()} CGT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rewards (Total)</span>
                <span className="text-white">{parseFloat(validator.rewardsTotal).toLocaleString()} CGT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slash Events */}
        {validator.slashEvents && validator.slashEvents.length > 0 && (
          <div className="glass-panel rounded-xl overflow-hidden border border-red-500/30">
            <div className="p-4 border-b border-white/10 bg-red-500/5">
              <h3 className="font-grunge text-lg text-red-400">⚠️ Slash Events</h3>
            </div>
            <div className="divide-y divide-white/5">
              {validator.slashEvents.map((event, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white">Era {event.era} - Block #{event.blockNumber}</p>
                    <p className="text-gray-500 text-sm">{event.reason}</p>
                  </div>
                  <span className="text-red-400">-{event.amount} CGT</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
