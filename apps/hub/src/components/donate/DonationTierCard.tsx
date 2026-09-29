'use client';

import { formatAmount, formatBps, type DonationTier } from '@/lib/donation-tiers';

interface DonationTierCardProps {
  tier: DonationTier;
  isCurrentTier?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const tierIcons: Record<number, string> = {
  1: '🌟',
  2: '⚔️',
  3: '🛡️',
  4: '👑',
  5: '✨',
};

export function DonationTierCard({ tier, isCurrentTier, onSelect, disabled }: DonationTierCardProps) {
  const isGodsent = tier.level === 5;

  return (
    <div
      className={`relative h-full transition-transform duration-200 ${isGodsent ? 'col-span-1' : ''} ${!disabled ? 'hover:scale-[1.02] hover:-translate-y-1' : ''}`}
    >
      {/* Current tier badge */}
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="px-3 py-1 bg-data-cyan text-void text-xs font-bold rounded-full">
            YOUR TIER
          </span>
        </div>
      )}

      <div
        className={`h-full p-6 rounded-2xl border-2 transition-all ${
          isGodsent
            ? 'bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-orange-900/40 border-transparent'
            : 'holo-panel border-lavender/20'
        } ${isCurrentTier ? 'ring-2 ring-data-cyan' : ''}`}
        style={{
          borderImage: isGodsent
            ? 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff) 1'
            : undefined,
        }}
      >
        {/* Tier Icon & Name */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{tierIcons[tier.level]}</div>
          <h3
            className="text-2xl font-bold"
            style={{
              color: tier.level === 5 ? undefined : tier.badgeColor,
              background: tier.level === 5 ? tier.badgeColor : undefined,
              WebkitBackgroundClip: tier.level === 5 ? 'text' : undefined,
              WebkitTextFillColor: tier.level === 5 ? 'transparent' : undefined,
            }}
          >
            {tier.name}
          </h3>
        </div>

        {/* Price Range */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 mb-1">Donation Range</div>
          <div className="text-xl font-bold text-white">
            {formatAmount(tier.minAmount)}
            {tier.maxAmount ? ` - ${formatAmount(tier.maxAmount)}` : '+'}
          </div>
        </div>

        {/* Rewards */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">CGT Reward</span>
            <span className="text-data-gold font-bold">{tier.cgtReward.toLocaleString()} CGT</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Staking Bonus</span>
            <span className="text-data-green font-bold">+{formatBps(tier.stakingBonusBps)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">XP Rate</span>
            <span className="text-data-cyan font-bold">+{formatBps(tier.xpRateBonusBps)}</span>
          </div>
          {tier.freeMints > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Free Mints</span>
              <span className="text-holographic font-bold">{tier.freeMints}</span>
            </div>
          )}
          {tier.energyDiscountBps > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Energy Discount</span>
              <span className="text-data-magenta font-bold">{formatBps(tier.energyDiscountBps)}</span>
            </div>
          )}
        </div>

        {/* Chat Privileges */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 mb-2">VYB Chat Perks</div>
          <div className="flex flex-wrap gap-1">
            {tier.chatPrivileges.map((priv) => (
              <span
                key={priv}
                className="px-2 py-1 text-xs bg-lavender/20 text-holographic rounded"
              >
                {priv.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Select Button */}
        <button
          onClick={onSelect}
          disabled={disabled || isCurrentTier}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isCurrentTier
              ? 'bg-gray-700 text-gray-400 cursor-default'
              : isGodsent
              ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white hover:opacity-90'
              : 'bg-gradient-to-r from-data-cyan to-holographic text-void hover:opacity-90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isCurrentTier ? 'Current Tier' : `Donate ${formatAmount(tier.minAmount)}+`}
        </button>
      </div>
    </div>
  );
}
