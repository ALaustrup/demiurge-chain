'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { DONATION_TIERS, SUBSCRIPTION_TIERS, formatAmount } from '@/lib/donation-tiers';
import { 
  DonationTierCard, 
  SubscriptionTierCard, 
  PaymentToggle,
  DonorStatusCard,
  DonationProgress 
} from '@/components/donate';

type PaymentMode = 'one-time' | 'subscription';

interface DonorStatus {
  isDonor: boolean;
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
  nextTier: {
    name: string;
    amountNeeded: string;
    progress: number;
  } | null;
}

export default function DonatePage() {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('one-time');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donorStatus, setDonorStatus] = useState<DonorStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const isAuthenticated = qorAuth.isAuthenticated();

  // Fetch donor status on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDonorStatus();
    } else {
      setLoadingStatus(false);
    }
  }, [isAuthenticated]);

  const fetchDonorStatus = async () => {
    try {
      const response = await fetch('/api/donate/status', {
        headers: {
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDonorStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch donor status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDonate = async (amountCents: number) => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/donate';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/donate/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
        body: JSON.stringify({ amountCents }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierLevel: number) => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/donate';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/donate/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
        body: JSON.stringify({ tierLevel }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000, 100000]; // cents

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-data-cyan via-holographic to-data-magenta bg-clip-text text-transparent">
              Support the Demiurge
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Fuel the future of decentralized gaming. Every contribution unlocks exclusive 
            rewards, staking bonuses, and eternal recognition on-chain.
          </p>
        </div>

        {/* Current Donor Status */}
        {donorStatus?.isDonor && (
          <div className="mb-12 animate-fade-in">
            <DonorStatusCard status={donorStatus} />
          </div>
        )}

        {/* Payment Mode Toggle */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <PaymentToggle mode={paymentMode} onChange={setPaymentMode} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-400 text-center">
              {error}
            </div>
          </div>
        )}

        {/* One-Time Donation */}
        {paymentMode === 'one-time' && (
          <div className="animate-fade-in">
              {/* Custom Amount Input */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="holo-panel p-6 rounded-2xl">
                  <label className="block text-holographic text-sm mb-3">Custom Amount</label>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        step="1"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full bg-void/50 border-2 border-lavender/30 rounded-xl py-4 pl-10 pr-4 text-2xl text-white placeholder-gray-600 focus:border-holographic focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const amount = parseFloat(customAmount);
                        if (amount >= 1) {
                          handleDonate(Math.round(amount * 100));
                        }
                      }}
                      disabled={loading || !customAmount || parseFloat(customAmount) < 1}
                      className="px-8 py-4 bg-gradient-to-r from-data-cyan to-holographic text-void font-bold text-lg rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Donate'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="max-w-4xl mx-auto mb-12">
                <p className="text-center text-gray-500 mb-4">Or choose a preset amount</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleDonate(amount)}
                      disabled={loading}
                      className="px-6 py-3 holo-panel rounded-lg text-holographic hover:bg-lavender/20 transition-colors disabled:opacity-50"
                    >
                      {formatAmount(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {DONATION_TIERS.map((tier) => (
                  <div key={tier.level} className="animate-fade-in">
                    <DonationTierCard
                      tier={tier}
                      isCurrentTier={donorStatus?.currentTier?.level === tier.level}
                      onSelect={() => handleDonate(tier.minAmount)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription */}
          {paymentMode === 'subscription' && (
            <div className="animate-fade-in">
              {/* Subscription Benefits Banner */}
              <div className="max-w-3xl mx-auto mb-12">
                <div className="holo-panel p-6 rounded-2xl border-2 border-data-cyan/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-data-cyan to-holographic flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-data-cyan">Subscription Bonus</h3>
                      <p className="text-gray-400">Get next-tier perks at current-tier price!</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-data-cyan">✓</span>
                      CGT distributed every billing cycle
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-data-cyan">✓</span>
                      Free mints replenished each cycle
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-data-cyan">✓</span>
                      Exclusive subscriber badge variant
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-data-cyan">✓</span>
                      1.5x governance voting power
                    </li>
                  </ul>
                </div>
              </div>

              {/* Subscription Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <div key={tier.level} className="animate-fade-in">
                    <SubscriptionTierCard
                      tier={tier}
                      effectiveTier={DONATION_TIERS.find(t => t.level === tier.effectiveTier)}
                      isCurrentSubscription={donorStatus?.subscription?.tier.level === tier.level}
                      onSelect={() => handleSubscribe(tier.level)}
                      disabled={loading || donorStatus?.subscription?.status === 'active'}
                    />
                  </div>
                ))}
              </div>

              {/* Active Subscription Notice */}
              {donorStatus?.subscription?.status === 'active' && (
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 text-center">
                    <p className="text-yellow-300">
                      You have an active subscription at {donorStatus.subscription.tier.name} tier.
                    </p>
                    <a
                      href="/settings/subscription"
                      className="text-data-cyan hover:underline mt-2 inline-block"
                    >
                      Manage your subscription →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Progress to Next Tier */}
        {donorStatus?.nextTier && (
          <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
            <DonationProgress
              currentAmount={donorStatus.lifetimeCents}
              nextTier={donorStatus.nextTier}
            />
          </div>
        )}

        {/* Not Logged In CTA */}
        {!isAuthenticated && (
          <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in">
            <div className="holo-panel p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-holographic mb-4">Login to Donate</h3>
              <p className="text-gray-400 mb-6">
                Create a QOR ID to receive your donor badge NFT and on-chain rewards.
              </p>
              <a
                href="/login?redirect=/donate"
                className="inline-block px-8 py-4 bg-gradient-to-r from-data-cyan to-holographic text-void font-bold text-lg rounded-xl hover:opacity-90 transition-opacity"
              >
                Login / Register
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
