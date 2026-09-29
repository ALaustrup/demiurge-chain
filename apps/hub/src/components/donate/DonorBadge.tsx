'use client';

interface DonorBadgeProps {
  tierLevel: number;
  tierName: string;
  isSubscriber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierColors: Record<number, { bg: string; border: string; text: string }> = {
  0: { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-400' },
  1: { bg: 'bg-gradient-to-br from-amber-900 to-amber-700', border: 'border-amber-500', text: 'text-amber-300' },
  2: { bg: 'bg-gradient-to-br from-gray-600 to-gray-400', border: 'border-gray-300', text: 'text-gray-100' },
  3: { bg: 'bg-gradient-to-br from-yellow-700 to-yellow-500', border: 'border-yellow-400', text: 'text-yellow-100' },
  4: { bg: 'bg-gradient-to-br from-purple-800 to-purple-500', border: 'border-purple-300', text: 'text-purple-100' },
  5: { bg: 'bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600', border: 'border-pink-300', text: 'text-white' },
};

const tierIcons: Record<number, string> = {
  0: '○',
  1: '🌟',
  2: '⚔️',
  3: '🛡️',
  4: '👑',
  5: '✨',
};

const sizeClasses: Record<string, { container: string; icon: string; text: string }> = {
  sm: { container: 'w-16 h-16', icon: 'text-2xl', text: 'text-xs' },
  md: { container: 'w-24 h-24', icon: 'text-4xl', text: 'text-sm' },
  lg: { container: 'w-32 h-32', icon: 'text-5xl', text: 'text-base' },
};

export function DonorBadge({ tierLevel, tierName, isSubscriber, size = 'md' }: DonorBadgeProps) {
  const colors = tierColors[tierLevel] || tierColors[0];
  const icon = tierIcons[tierLevel] || tierIcons[0];
  const sizes = sizeClasses[size];

  return (
    <div className="relative hover:scale-105 transition-transform duration-200">
      {/* Glow effect for high tiers */}
      {tierLevel >= 4 && (
        <div
          className={`absolute inset-0 ${sizes.container} rounded-full blur-xl opacity-50`}
          style={{
            background: tierLevel === 5
              ? 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0)'
              : 'rgba(147, 51, 234, 0.5)',
          }}
        />
      )}

      {/* Main badge */}
      <div
        className={`relative ${sizes.container} rounded-full ${colors.bg} border-4 ${colors.border} flex flex-col items-center justify-center shadow-lg`}
      >
        {/* Icon */}
        <span className={sizes.icon}>{icon}</span>

        {/* Tier name */}
        <span className={`${sizes.text} font-bold ${colors.text} mt-1`}>
          {tierName}
          {isSubscriber && <span className="text-data-cyan">+</span>}
        </span>

        {/* Subscriber indicator */}
        {isSubscriber && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span className="px-2 py-0.5 text-xs bg-data-cyan text-void font-bold rounded-full">
              SUB
            </span>
          </div>
        )}
      </div>

      {/* Animated ring for Godsent tier (CSS animation) */}
      {tierLevel === 5 && (
        <div
          className={`absolute inset-0 ${sizes.container} rounded-full border-2 border-transparent animate-spin-slow`}
          style={{
            background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000) border-box',
            animationDuration: '8s',
          }}
        />
      )}
    </div>
  );
}
