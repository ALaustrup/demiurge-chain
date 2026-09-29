'use client';

import { formatAmount, formatBps, type SubscriptionTier, type DonationTier } from '@/lib/donation-tiers';

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  effectiveTier?: DonationTier;
  isCurrentSubscription?: boolean;
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

export function SubscriptionTierCard({
  tier,
  effectiveTier,
  isCurrentSubscription,
  onSelect,
  disabled,
}: SubscriptionTierCardProps) {
  const isTopTier = tier.level === 5;

  return (
    <div
      className={`relative h-full transition-transform duration-200 ${!disabled ? 'hover:scale-[1.02] hover:-translate-y-1' : ''}`}
    >
      {/* Tier-up bonus badge */}
      <div className="absolute -top-3 -right-2 z-10">
        <span className="px-2 py-1 bg-gradient-to-r from-data-cyan to-data-magenta text-white text-xs font-bold rounded-full shadow-lg">
          TIER UP!
        </span>
      </div>

      {/* Current subscription badge */}
      {isCurrentSubscription && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="px-3 py-1 bg-data-green text-void text-xs font-bold rounded-full">
            ACTIVE
          </span>
        </div>
      )}

      <div
        className={`h-full p-6 rounded-2xl border-2 transition-all ${
          isTopTier
            ? 'bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-orange-900/40 border-holographic/50'
            : 'holo-panel border-data-cyan/30'
        } ${isCurrentSubscription ? 'ring-2 ring-data-green' : ''}`}
      >
        {/* Tier Icon & Name */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{tierIcons[tier.level]}</div>
          <h3 className="text-2xl font-bold text-data-cyan">{tier.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Gets <span className="text-holographic font-bold">{effectiveTier?.name}</span> perks
          </p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 mb-1">Bi-Weekly</div>
          <div className="text-3xl font-bold text-white">
            {formatAmount(tier.biWeeklyAmount)}
          </div>
          <div className="text-xs text-gray-500">
            ~{formatAmount(Math.round(tier.biWeeklyAmount * 2.17))}/month
          </div>
        </div>

        {/* Per-Cycle Rewards */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">CGT / Cycle</span>
            <span className="text-data-gold font-bold">{tier.cgtPerCycle.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Mints / Cycle</span>
            <span className="text-holographic font-bold">{tier.freeMintsCycle}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-lavender/20 my-4" />

        {/* Effective Tier Perks */}
        {effectiveTier && (
          <div className="space-y-2 mb-6">
            <div className="text-xs text-data-cyan font-bold uppercase tracking-wide">
              {effectiveTier.name} Perks Included
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>+{formatBps(effectiveTier.stakingBonusBps)} staking</div>
              <div>+{formatBps(effectiveTier.xpRateBonusBps)} XP rate</div>
              {effectiveTier.energyDiscountBps > 0 && (
                <div>{formatBps(effectiveTier.energyDiscountBps)} energy discount</div>
              )}
            </div>
          </div>
        )}

        {/* Subscriber Exclusives */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 mb-2">Subscriber Exclusives</div>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 text-xs bg-data-cyan/20 text-data-cyan rounded">
              {tier.badgeSuffix} badge
            </span>
            <span className="px-2 py-1 text-xs bg-data-cyan/20 text-data-cyan rounded">
              1.5x vote
            </span>
          </div>
        </div>

        {/* Select Button */}
        <button
          onClick={onSelect}
          disabled={disabled}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isCurrentSubscription
              ? 'bg-gray-700 text-gray-400 cursor-default'
              : 'bg-gradient-to-r from-data-cyan to-data-magenta text-white hover:opacity-90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isCurrentSubscription ? 'Current Plan' : `Subscribe ${formatAmount(tier.biWeeklyAmount)}/2wk`}
        </button>
      </div>
    </div>
  );
}
