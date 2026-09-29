'use client';

interface LevelProgressBarProps {
  currentXp: number;
  level: number;
  /** XP needed for next level (0 if max) */
  xpToNext: number;
  /** Progress percentage 0-100 */
  progress: number;
  compact?: boolean;
}

export function LevelProgressBar({ currentXp, level, xpToNext, progress, compact }: LevelProgressBarProps) {
  const isMaxLevel = xpToNext === 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-black/40 border border-cyber/30 px-2 py-0.5">
          <span className="text-[10px] font-mono text-cyber">LVL {level}</span>
        </div>
        <div className="flex-1 h-1.5 bg-architect-surface border border-ink-dim/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber to-cyber-bright transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-ink-muted">{progress}%</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center bg-cyber/10 border border-cyber/30">
            <span className="text-xl font-mono text-cyber font-bold">{level}</span>
          </div>
          <div>
            <p className="text-xs font-display text-ink-muted tracking-wider">LEVEL</p>
            <p className="text-lg font-mono text-white">{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-display text-ink-muted tracking-wider">TOTAL XP</p>
          <p className="text-lg font-mono text-cyber">{currentXp.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-architect-surface border border-ink-dim/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber via-cyber-bright to-cyber transition-all duration-700 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 animate-breathing" />
          </div>
        </div>
        {/* Tick marks */}
        <div className="flex justify-between mt-1">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className={`w-px h-1.5 ${tick <= progress ? 'bg-cyber/60' : 'bg-ink-dim/30'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-mono text-ink-dim">
          {isMaxLevel ? 'MAX LEVEL REACHED' : `${xpToNext.toLocaleString()} XP to next level`}
        </span>
        <span className="text-[10px] font-mono text-cyber">{progress}%</span>
      </div>
    </div>
  );
}
