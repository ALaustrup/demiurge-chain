"use client";

import { Star, Sparkles, TrendingUp } from "lucide-react";

/**
 * Default XP thresholds for leveling
 */
const DEFAULT_LEVELS = [
  { level: 1, cumXp: 0 },
  { level: 2, cumXp: 100 },
  { level: 3, cumXp: 300 },
  { level: 4, cumXp: 700 },
  { level: 5, cumXp: 1500 },
  { level: 6, cumXp: 3100 },
  { level: 7, cumXp: 6300 },
  { level: 8, cumXp: 12700 },
  { level: 9, cumXp: 25500 },
  { level: 10, cumXp: 51100 },
];

/**
 * Calculate level from XP
 */
function calculateLevel(xp, levels = DEFAULT_LEVELS) {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].cumXp) {
      return levels[i].level;
    }
  }
  return 1;
}

/**
 * Calculate XP progress to next level
 */
function calculateProgress(xp, levels = DEFAULT_LEVELS) {
  const currentLevel = calculateLevel(xp, levels);
  const currentConfig = levels.find(l => l.level === currentLevel);
  const nextConfig = levels.find(l => l.level === currentLevel + 1);

  if (!nextConfig || !currentConfig) {
    return { progress: 100, xpInLevel: 0, xpNeeded: 0, isMaxLevel: true };
  }

  const xpInLevel = xp - currentConfig.cumXp;
  const xpNeeded = nextConfig.cumXp - currentConfig.cumXp;
  const progress = Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100));

  return { progress, xpInLevel, xpNeeded, isMaxLevel: false };
}

/**
 * Level Progress Component
 * 
 * Displays XP bar and level information for DRC-369 evolving NFTs.
 */
export default function LevelProgress({ 
  xp = 0, 
  showDetails = true,
  size = 'default', // 'compact', 'default', 'large'
  animate = true,
}) {
  const level = calculateLevel(xp);
  const { progress, xpInLevel, xpNeeded, isMaxLevel } = calculateProgress(xp);

  // Size variants
  const sizes = {
    compact: {
      container: 'p-2',
      levelBadge: 'w-8 h-8 text-sm',
      bar: 'h-1.5',
      text: 'text-xs',
    },
    default: {
      container: 'p-4',
      levelBadge: 'w-12 h-12 text-lg',
      bar: 'h-2',
      text: 'text-sm',
    },
    large: {
      container: 'p-6',
      levelBadge: 'w-16 h-16 text-2xl',
      bar: 'h-3',
      text: 'text-base',
    },
  };

  const s = sizes[size];

  // Level color gradient
  const getLevelColor = (lvl) => {
    if (lvl <= 2) return 'from-gray-400 to-gray-500';
    if (lvl <= 4) return 'from-green-400 to-green-600';
    if (lvl <= 6) return 'from-blue-400 to-blue-600';
    if (lvl <= 8) return 'from-purple-400 to-purple-600';
    return 'from-amber-400 to-amber-600';
  };

  return (
    <div className={`bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] ${s.container}`}>
      <div className="flex items-center gap-4">
        {/* Level Badge */}
        <div className={`relative flex items-center justify-center ${s.levelBadge} rounded-full bg-gradient-to-br ${getLevelColor(level)} text-white font-bold shadow-lg`}>
          {level}
          {isMaxLevel && (
            <Sparkles 
              className="absolute -top-1 -right-1 text-amber-400" 
              size={size === 'compact' ? 12 : 16} 
            />
          )}
        </div>

        {/* Progress Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold text-black dark:text-white ${s.text}`}>
              Level {level}
              {isMaxLevel && <span className="ml-1 text-amber-500">(MAX)</span>}
            </span>
            {showDetails && !isMaxLevel && (
              <span className={`text-black/60 dark:text-white/60 ${s.text}`}>
                {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            )}
          </div>

          {/* XP Bar */}
          <div className={`w-full bg-[#E6E6E6] dark:bg-[#333333] rounded-full overflow-hidden ${s.bar}`}>
            <div 
              className={`h-full bg-gradient-to-r ${getLevelColor(level)} rounded-full transition-all duration-500 ease-out`}
              style={{ 
                width: `${progress}%`,
                ...(animate && { transition: 'width 0.5s ease-out' })
              }}
            />
          </div>

          {/* Total XP */}
          {showDetails && (
            <div className={`flex items-center gap-1 mt-1 text-black/40 dark:text-white/40 ${s.text}`}>
              <TrendingUp size={size === 'compact' ? 10 : 12} />
              <span>Total: {xp.toLocaleString()} XP</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline XP display for cards/lists
 */
export function InlineLevel({ xp = 0, showXp = false }) {
  const level = calculateLevel(xp);
  const { progress } = calculateProgress(xp);

  const getLevelColor = (lvl) => {
    if (lvl <= 2) return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    if (lvl <= 4) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (lvl <= 6) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (lvl <= 8) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getLevelColor(level)}`}>
        Lv.{level}
      </span>
      {showXp && (
        <span className="text-xs text-black/40 dark:text-white/40">
          {xp.toLocaleString()} XP
        </span>
      )}
    </div>
  );
}

/**
 * Level up animation overlay
 */
export function LevelUpAnimation({ show, newLevel, onComplete }) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
      onClick={onComplete}
    >
      <div className="text-center animate-bounce-in">
        <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-spin-slow" />
        <h2 className="text-4xl font-bold text-white mb-2">Level Up!</h2>
        <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          {newLevel}
        </div>
        <p className="text-white/60 mt-4">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
