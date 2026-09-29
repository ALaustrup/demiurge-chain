'use client';

import { useEffect, useState } from 'react';
import { getLevelInfo, type LevelInfo } from '@demiurge/qor-sdk';

interface LevelDisplayProps {
  totalXP: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelDisplay({ totalXP, showProgress = true, size = 'md' }: LevelDisplayProps) {
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

  useEffect(() => {
    const info = getLevelInfo(totalXP);
    setLevelInfo(info);
  }, [totalXP]);

  if (!levelInfo) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const tierColors = {
    awakening: 'text-demiurge-cyan',
    disciple: 'text-demiurge-violet',
    'creator-god': 'text-demiurge-gold',
  };

  return (
    <div className={`${sizeClasses[size]}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${tierColors[levelInfo.tier]}`}>
          Lv. {levelInfo.level}
        </span>
        <span className="text-gray-400 text-xs">({levelInfo.title})</span>
      </div>
      
      {showProgress && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{levelInfo.currentXP} / {levelInfo.xpRequired} XP</span>
            <span>{Math.round(levelInfo.xpProgress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                levelInfo.tier === 'creator-god'
                  ? 'bg-gradient-to-r from-demiurge-gold to-demiurge-violet'
                  : levelInfo.tier === 'disciple'
                  ? 'bg-gradient-to-r from-demiurge-violet to-demiurge-cyan'
                  : 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet'
              }`}
              style={{ width: `${levelInfo.xpProgress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
