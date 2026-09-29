'use client';

import { useAuth } from '@/contexts/AuthContext';
import { QorIdAvatar } from '@/components/QorIdAvatar';
import { calculateLevel, calculateXpProgress, getTierInfo, XP_SOURCES } from '@demiurge/qor-sdk';

interface ProfileCardProps {
  xp?: number;
}

export function ProfileCard({ xp = 0 }: ProfileCardProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  const level = calculateLevel(xp);
  const progress = calculateXpProgress(xp);
  const tier = getTierInfo(level);

  return (
    <div className="glass-panel rounded-xl p-6 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {/* Avatar scaled up with transform */}
          <div className="transform scale-125 origin-center">
            <QorIdAvatar user={user} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-neon-cyan text-black text-xs font-bold px-2 py-0.5 rounded-full">
            Lv.{level}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{user.qor_id}</h3>
          <p className="text-sm text-gray-400">{tier.name}</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">XP Progress</span>
          <span className="text-neon-cyan">{progress.currentXp} / {progress.requiredXp}</span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-neon-cyan">{level}</div>
          <div className="text-xs text-gray-400">Level</div>
        </div>
        <div className="glass-panel p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-neon-magenta">{xp.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total XP</div>
        </div>
      </div>

      {/* Role Badge */}
      {user.role === 'god' && (
        <div className="mt-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-3 text-center">
          <span className="text-yellow-400 font-bold">GOD MODE ACTIVE</span>
        </div>
      )}
    </div>
  );
}
