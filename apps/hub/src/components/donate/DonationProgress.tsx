'use client';

interface DonationProgressProps {
  currentAmount: number; // cents
  nextTier: {
    name: string;
    amountNeeded: string;
    progress: number;
  };
}

export function DonationProgress({ currentAmount, nextTier }: DonationProgressProps) {
  return (
    <div className="holo-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-400">Progress to {nextTier.name}</div>
        <div className="text-sm text-holographic font-bold">
          {nextTier.amountNeeded} to go
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-void rounded-full overflow-hidden">
        <div
          style={{ width: `${Math.min(100, nextTier.progress)}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-data-cyan via-holographic to-data-magenta rounded-full transition-all duration-1000 ease-out"
        />
        {/* Glow effect */}
        <div
          style={{ width: `${Math.min(100, nextTier.progress)}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-data-cyan/50 via-holographic/50 to-data-magenta/50 rounded-full blur-sm transition-all duration-1000 ease-out"
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>${(currentAmount / 100).toFixed(2)}</span>
        <span>{nextTier.progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
