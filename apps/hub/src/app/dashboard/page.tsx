'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileCard, DailyTasksPanel, WalletWidget, UpdatesPanel, BlogPanel } from '@/components/dashboard';
import Link from 'next/link';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  reward: string | null;
  color: string;
}

interface NetworkInfo {
  era: number;
  blockNumber: number;
  validators: number;
  totalStake: string;
  connected: boolean;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // NOTE: No redirect needed - AuthGate ensures users are authenticated before reaching this page

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    // Load network info regardless of auth
    loadNetworkInfo();
    const netInterval = setInterval(loadNetworkInfo, 15000);
    return () => clearInterval(netInterval);
  }, [user]);

  const loadNetworkInfo = async () => {
    try {
      const info = await demiurgeRpc.getChainInfo();
      setNetworkInfo({
        era: info.currentEra,
        blockNumber: info.blockHeight,
        validators: info.validators,
        totalStake: info.totalStake,
        connected: info.connected,
      });
    } catch {
      // Silently fail — widget will show offline state
    }
  };

  const loadUserData = async () => {
    setLoadingActivity(true);
    try {
      // Fetch real user stats
      const userStats = await demiurgeRpc.getUserStats(user?.id || '');
      if (userStats) {
        setUserXp(userStats.xp || 0);
        setUserLevel(userStats.level || 1);
      }
      
      // Fetch real activity
      const activity = await demiurgeRpc.getUserActivity(user?.id || '');
      if (activity && activity.length > 0) {
        setRecentActivity(activity.map((a: any) => ({
          id: a.id,
          icon: getActivityIcon(a.type),
          text: a.description,
          time: formatActivityTime(a.timestamp),
          reward: a.reward ? `+${a.reward} Sparks` : null,
          color: getActivityColor(a.type),
        })));
      }
    } catch (error) {
      console.warn('Could not load user data:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'game': return '🎮';
      case 'transfer': return '💰';
      case 'task': return '✅';
      case 'level_up': return '🆙';
      case 'nft': return '🖼️';
      default: return '📌';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'game': return 'from-cyan-500/20';
      case 'transfer': return 'from-green-500/20';
      case 'task': return 'from-violet-500/20';
      case 'level_up': return 'from-yellow-500/20';
      default: return 'from-gray-500/20';
    }
  };

  const formatActivityTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Show loading state
  if (loading || !user) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-demiurge-cyan/10 via-transparent to-demiurge-violet/10 rounded-2xl blur-3xl -z-10" />
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-4">
            Welcome back, <span className="gradient-text">{user?.qor_id}</span>
            <span className="holo-badge">Level {userLevel}</span>
          </h1>
          <p className="text-gray-400">
            Your on-chain command center for the Demiurge ecosystem
          </p>
          {/* XP Progress Bar */}
          <div className="mt-4 max-w-md">
            {userXp > 0 ? (
              <>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>XP Progress</span>
                  <span>{userXp % 500}/500 XP to next level</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(userXp % 500) / 5}%` }} />
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Complete tasks and create NFTs to earn XP</p>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/create"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>🎨</span>
            <span>Create</span>
          </Link>
          <Link
            href="/scattertxt"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>⌨️</span>
            <span>ScatterTXT</span>
          </Link>
          <Link
            href="/social"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>💬</span>
            <span>VYB Social</span>
          </Link>
          <Link
            href="/settings"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* Network Status Bar */}
        {networkInfo && (
          <div className="mb-6 futuristic-card p-4 scan-line-overlay">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${networkInfo.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400 uppercase tracking-wider font-display">
                  {networkInfo.connected ? 'Mainnet Live' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Era</p>
                  <p className="text-sm font-bold text-white font-mono">{networkInfo.era}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Block</p>
                  <p className="text-sm font-bold text-white font-mono">{networkInfo.blockNumber.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Validators</p>
                  <p className="text-sm font-bold text-green-400 font-mono">{networkInfo.validators}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Stake</p>
                  <p className="text-sm font-bold text-demiurge-cyan font-mono">
                    {(Number(BigInt(networkInfo.totalStake || '0')) / 100).toLocaleString()} CGT
                  </p>
                </div>
              </div>
              <Link
                href="/staking"
                className="text-xs text-demiurge-cyan hover:underline font-display uppercase tracking-wider"
              >
                Staking →
              </Link>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Wallet */}
          <div className="space-y-6">
            <ProfileCard xp={userXp} />
            <WalletWidget />
          </div>

          {/* Middle Column - Daily Tasks */}
          <div className="lg:col-span-1">
            <DailyTasksPanel 
              onTasksUpdate={(count, sparks) => {
                // Could update a global state here
              }}
            />
          </div>

          {/* Right Column - Updates & Blog */}
          <div className="space-y-6">
            <UpdatesPanel />
            <BlogPanel />
          </div>
        </div>

        {/* Bottom Section - Recent Activity */}
        <div className="mt-8 futuristic-card p-6 scan-line-overlay">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-demiurge-cyan animate-pulse" />
              Recent Activity
            </h3>
            <Link href="/analytics" className="text-sm text-demiurge-cyan hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {loadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-400">No recent activity</p>
                <p className="text-xs text-gray-500 mt-1">Create NFTs, complete tasks, or trade to see activity here</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => (
                <div 
                  key={activity.id} 
                  className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${activity.color} to-transparent border border-white/5 hover:border-demiurge-cyan/30 transition-all cascade-item`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-black/30">{activity.icon}</span>
                    <div>
                      <div className="text-white font-medium">{activity.text}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                  {activity.reward && (
                    <span className="text-sm text-neon-green font-bold bg-green-500/10 px-3 py-1 rounded-full">{activity.reward}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
