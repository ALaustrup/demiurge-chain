'use client';

import { DonorBadge } from './DonorBadge';

interface DonorStatusCardProps {
  status: {
    lifetimeCents: number;
    currentTier: { level: number; name: string; color: string } | null;
    subscription: {
      status: string;
      tier: { level: number; name: string };
      currentPeriodEnd: string;
    } | null;
    effectiveTier: { level: number; name: string; color: string } | null;
    perks: {
      stakingBonus: string;
      xpBonus: string;
      freeMints: number;
      chatPrivileges: string[];
    };
  };
}

export function DonorStatusCard({ status }: DonorStatusCardProps) {
  const lifetimeAmount = (status.lifetimeCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="holo-panel p-6 rounded-2xl max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Badge Display */}
        <div className="flex-shrink-0">
          <DonorBadge
            tierLevel={status.effectiveTier?.level || 0}
            tierName={status.effectiveTier?.name || 'None'}
            isSubscriber={status.subscription?.status === 'active'}
          />
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Lifetime</div>
            <div className="text-xl font-bold text-data-gold">{lifetimeAmount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Staking Bonus</div>
            <div className="text-xl font-bold text-data-green">{status.perks.stakingBonus}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">XP Rate</div>
            <div className="text-xl font-bold text-data-cyan">{status.perks.xpBonus}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Free Mints</div>
            <div className="text-xl font-bold text-holographic">{status.perks.freeMints}</div>
          </div>
        </div>

        {/* Subscription Status */}
        {status.subscription && (
          <div className="flex-shrink-0 text-center">
            <div className="text-xs text-gray-500 mb-1">Subscription</div>
            <div className={`text-sm font-bold ${
              status.subscription.status === 'active' ? 'text-data-green' : 'text-gray-400'
            }`}>
              {status.subscription.status === 'active' ? 'Active' : status.subscription.status}
            </div>
            {status.subscription.status === 'active' && (
              <div className="text-xs text-gray-500">
                Renews {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Privileges */}
      {status.perks.chatPrivileges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-lavender/20">
          <div className="text-xs text-gray-500 mb-2">VYB Chat Privileges</div>
          <div className="flex flex-wrap gap-2">
            {status.perks.chatPrivileges.map((priv) => (
              <span
                key={priv}
                className="px-3 py-1 text-sm bg-lavender/20 text-holographic rounded-full"
              >
                {priv === 'all' ? 'All Effects' : priv.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
