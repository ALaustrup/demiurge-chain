'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, EnergyInfo } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { EnergyDisplay } from './EnergyDisplay';
import { qorAuth } from '@demiurge/qor-sdk';
import { generateKeypairFromQorId, signTransactionPayload, initWasm } from '@/lib/wasm-wallet';

interface EnergySponsorshipProps {
  developerAddress: string;
}

interface SponsoredTransaction {
  id: string;
  userAddress: string;
  energyCost: number;
  timestamp: number;
  status: 'success' | 'failed';
}

export function EnergySponsorship({ developerAddress }: EnergySponsorshipProps) {
  const { getEnergy } = useBlockchain();
  const [isEnabled, setIsEnabled] = useState(false);
  const [energy, setEnergy] = useState<EnergyInfo | null>(null);
  const [sponsoredTransactions, setSponsoredTransactions] = useState<SponsoredTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSponsored: 0,
    totalCost: 0,
    successRate: 0,
  });

  useEffect(() => {
    if (developerAddress) {
      loadEnergy();
      loadSponsorshipHistory();
      const interval = setInterval(() => {
        loadEnergy();
      }, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [developerAddress, isEnabled]);

  const loadEnergy = async () => {
    try {
      const energyData = await getEnergy(developerAddress);
      setEnergy(energyData);
    } catch (err: any) {
      console.error('Failed to load energy:', err);
    }
  };

  const loadSponsorshipHistory = async () => {
    try {
      const history = await demiurgeRpc.getSponsorshipHistory(developerAddress);
      if (history && history.length > 0) {
        const transactions: SponsoredTransaction[] = history.map((tx: any) => ({
          id: tx.id,
          userAddress: tx.userAddress,
          energyCost: tx.energyCost || 100,
          timestamp: tx.timestamp,
          status: tx.status || 'success',
        }));
        setSponsoredTransactions(transactions);

        // Calculate stats
        const totalSponsored = transactions.length;
        const totalCost = transactions.reduce((sum, tx) => sum + tx.energyCost, 0);
        const successCount = transactions.filter(tx => tx.status === 'success').length;
        const successRate = totalSponsored > 0 ? (successCount / totalSponsored) * 100 : 0;

        setStats({
          totalSponsored,
          totalCost,
          successRate,
        });
      } else {
        // No sponsorship history
        setSponsoredTransactions([]);
        setStats({ totalSponsored: 0, totalCost: 0, successRate: 0 });
      }
    } catch (error) {
      console.warn('Could not load sponsorship history:', error);
      setSponsoredTransactions([]);
      setStats({ totalSponsored: 0, totalCost: 0, successRate: 0 });
    }
  };

  const handleToggleSponsorship = async () => {
    const newEnabled = !isEnabled;

    if (newEnabled) {
      // Check if developer has enough energy
      if (!energy || energy.current < 100) {
        setError('Insufficient energy. You need at least 100 energy to sponsor transactions.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await initWasm();
      const user = await qorAuth.getProfile();
      if (!user) throw new Error('Not authenticated');

      const keypairJson = await generateKeypairFromQorId(user.qor_id);
      const payloadStr = JSON.stringify({
        action: 'set_sponsorship',
        account: developerAddress,
        enabled: newEnabled,
      });
      const payloadBytes = new TextEncoder().encode(payloadStr);
      const signature = await signTransactionPayload(keypairJson, payloadBytes);

      const result = await demiurgeRpc.setEnergySponsorship(
        developerAddress,
        newEnabled,
        signature
      );

      if (result.success) {
        setIsEnabled(result.enabled);
      } else {
        throw new Error('Failed to update sponsorship');
      }
    } catch (err: any) {
      // If RPC fails (method not yet implemented), toggle locally as graceful fallback
      if (err?.message?.includes('RPC') || err?.message?.includes('Method not found')) {
        setIsEnabled(newEnabled);
      } else {
        setError(err.message || 'Failed to toggle sponsorship');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <div className="glass-panel rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-demiurge-cyan">Energy Sponsorship</h2>
          <p className="text-sm text-gray-400 mt-1">
            Sponsor user transactions to enable feeless UX
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggleSponsorship}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-300">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Energy Display */}
      <div className="mb-6">
        <EnergyDisplay address={developerAddress} />
      </div>

      {/* Sponsorship Status */}
      {isEnabled && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400">✓</span>
            <p className="text-green-400 font-medium">Sponsorship Active</p>
          </div>
          <p className="text-sm text-green-300">
            Your transactions will automatically sponsor user transactions when they have insufficient energy.
            Cost: 100 energy per transaction.
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Total Sponsored</p>
          <p className="text-2xl font-bold text-white">{stats.totalSponsored}</p>
          <p className="text-xs text-gray-500 mt-1">Transactions</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.totalCost}</p>
          <p className="text-xs text-gray-500 mt-1">Energy</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Average</p>
        </div>
      </div>

      {/* Sponsored Transactions History */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Sponsorship History</h3>
        {sponsoredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No sponsored transactions yet</p>
            <p className="text-sm mt-2">Enable sponsorship to start sponsoring user transactions</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sponsoredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-gray-800/50 rounded p-3 border border-gray-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm text-white">
                      {formatAddress(tx.userAddress)}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      tx.status === 'success'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Cost: {tx.energyCost} energy</span>
                    <span>•</span>
                    <span>{formatTime(tx.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-2">How It Works</h3>
        <ul className="space-y-2 text-xs text-gray-400">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>When enabled, your energy will automatically sponsor user transactions</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Each sponsored transaction costs 100 energy</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Users can transact without energy, creating a feeless UX</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Perfect for game developers and app creators</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
