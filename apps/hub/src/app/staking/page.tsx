'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { getOrCreateAddressForQorId, formatQorId } from '@/lib/qor-wallet';
import { ValidatorDashboard } from '@/components/consensus/ValidatorDashboard';
import { EnhancedStakingPanel } from '@/components/consensus/EnhancedStakingPanel';
import { StakingHistory } from '@/components/consensus/StakingHistory';
import { EnergyDisplay } from '@/components/energy/EnergyDisplay';

export default function StakingPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [qorId, setQorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsAuthenticated(qorAuth.isAuthenticated());
  }, []);

  useEffect(() => {
    loadWallet();
  }, [isAuthenticated]);

  const loadWallet = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await qorAuth.getProfile();
      setQorId(profile.qor_id);

      const userAddress = await getOrCreateAddressForQorId(profile, false);
      setAddress(userAddress);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = () => {
    // Refresh data after staking
    setRefreshKey(prev => prev + 1);
    loadWallet();
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-demiurge-cyan mb-4">Staking</h1>
            <p className="text-gray-300 mb-6">
              Sign in with your Qor ID to start staking and earning rewards.
            </p>
            <a
              href="/login"
              className="inline-block bg-demiurge-cyan text-black font-bold py-2 px-6 rounded hover:bg-demiurge-cyan/80 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Staking</h1>
            <div className="flex items-center gap-4 mt-2">
              {qorId && (
                <p className="text-demiurge-cyan font-semibold">
                  {formatQorId(qorId)}
                </p>
              )}
              {address && (
                <p className="text-gray-400 text-sm font-mono">
                  {address.slice(0, 8)}...{address.slice(-8)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setRefreshKey(prev => prev + 1);
              loadWallet();
            }}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
          >
            Refresh
          </button>
        </div>

        {/* Energy Display */}
        {address && (
          <div className="max-w-md">
            <EnergyDisplay address={address} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Staking Panel */}
          <div className="space-y-6">
            {address ? (
              <EnhancedStakingPanel address={address} onStake={handleStake} />
            ) : (
              <div className="glass-panel rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400">Loading wallet address...</p>
              </div>
            )}
          </div>

          {/* Right Column: Validator Dashboard */}
          <div className="space-y-6">
            <ValidatorDashboard address={address || undefined} />
          </div>
        </div>

        {/* Staking History */}
        {address && (
          <div key={refreshKey}>
            <StakingHistory address={address} />
          </div>
        )}

        {/* Info Section */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">How Staking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">1. Select a Validator</h3>
              <p>Choose a validator to nominate. Lower commission rates mean higher rewards for you.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2. Nominate Your Stake</h3>
              <p>Lock your CGT tokens by nominating a validator. Your funds remain locked until you unbond.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">3. Earn Rewards</h3>
              <p>Rewards are distributed at the end of each era based on validator performance and your stake proportion.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">4. Unbond When Ready</h3>
              <p>You can unbond your stake at any time. There may be an unbonding period before funds are available.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
