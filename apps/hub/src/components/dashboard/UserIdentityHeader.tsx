'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatQorId } from '@/lib/qor-wallet';
import { KarmaBadge } from '@/components/vyb/KarmaDisplay';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: number;
  karma: number;
}

export function UserIdentityHeader() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    achievements: 0,
    karma: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    setLoading(true);
    try {
      // Fetch real user stats from API
      const userStats = await demiurgeRpc.getUserStats(user?.id || '');
      if (userStats) {
        const xpToNext = Math.ceil((userStats.level + 1) * 500);
        setStats({
          level: userStats.level || 1,
          xp: userStats.xp || 0,
          xpToNextLevel: xpToNext,
          achievements: userStats.achievements || 0,
          karma: userStats.karma || 0,
        });
      }
    } catch (error) {
      console.warn('Could not load user stats:', error);
      // Keep default empty stats on error
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-neon-cyan/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
              Welcome to Demiurge
            </h1>
            <p className="text-gray-400 mt-1">The Metaverse Operating System</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-grunge-alt py-3 px-6 rounded-lg hover:scale-105 transition-all"
            >
              Create
            </Link>
            <Link
              href="/development"
              className="glass-panel border border-neon-cyan/30 text-neon-cyan font-grunge-alt py-3 px-6 rounded-lg hover:border-neon-cyan transition-all"
            >
              Developers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const xpProgress = (stats.xp / stats.xpToNextLevel) * 100;

  return (
    <div className="glass-panel rounded-xl p-6 border border-neon-cyan/20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-64 h-64 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-magenta/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan via-neon-magenta to-neon-green p-1">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl animate-glow-pulse">
              👤
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-neon-cyan text-black font-bold text-xs px-2 py-1 rounded-full">
            Lv.{stats.level}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-grunge text-white animate-text-glow">
            {user.qor_id?.split('#')[0] || 'Architect'}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
            <span className="text-neon-cyan font-mono text-sm">
              {formatQorId(user.qor_id || '')}
            </span>
            <KarmaBadge karma={stats.karma} size="sm" />
          </div>
          
          {/* XP Progress */}
          <div className="mt-3 max-w-xs mx-auto md:mx-0">
            {loading ? (
              <div className="h-6 bg-black/30 rounded animate-pulse" />
            ) : stats.xp > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Level {stats.level}</span>
                  <span className="text-neon-cyan">{stats.xp.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Complete tasks to earn XP</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl font-grunge text-neon-green">
              {loading ? '...' : stats.achievements}
            </div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <Link href="/settings" className="text-center hover:scale-110 transition-transform">
            <div className="text-2xl">⚙️</div>
            <div className="text-xs text-gray-400">Settings</div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.5)); }
          50% { filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.8)); }
        }
        
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
          50% { text-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .animate-text-glow {
          animation: text-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
