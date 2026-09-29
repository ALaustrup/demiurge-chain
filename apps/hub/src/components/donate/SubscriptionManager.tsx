'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DonorBadge } from './DonorBadge';
import { formatAmount, getSubscriptionTierByLevel, getTierByLevel } from '@/lib/donation-tiers';

interface SubscriptionData {
  status: 'active' | 'past_due' | 'cancelled' | 'paused' | 'none';
  tier: {
    level: number;
    name: string;
  };
  effectiveTierName?: string;
  currentPeriodEnd?: string;
  cgtPerCycle: number;
  subscriptionCgtReceived: number;
}

interface SubscriptionManagerProps {
  subscription: SubscriptionData | null;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: () => Promise<void>;
  onUpgrade: (tierLevel: number) => Promise<void>;
  onManageBilling: () => Promise<void>;
}

export function SubscriptionManager({
  subscription,
  onPause,
  onResume,
  onCancel,
  onUpgrade,
  onManageBilling,
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!subscription || subscription.status === 'none') {
    return null;
  }

  const tier = getSubscriptionTierByLevel(subscription.tier.level);
  const effectiveTier = getTierByLevel(tier?.effectiveTier || 0);
  const nextRenewal = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd) 
    : null;

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setIsLoading(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Failed to ${actionName}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active': return 'text-data-green';
      case 'past_due': return 'text-data-gold';
      case 'paused': return 'text-data-cyan';
      case 'cancelled': return 'text-data-red';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case 'active': return 'Active';
      case 'past_due': return 'Payment Due';
      case 'paused': return 'Paused';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="holo-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Subscription</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor()} bg-current/10`}>
          {getStatusText()}
        </span>
      </div>

      {/* Current Plan */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-ultraviolet/30 rounded-xl">
        <DonorBadge
          tierLevel={tier?.effectiveTier || 0}
          tierName={effectiveTier?.name || 'Unknown'}
          isSubscriber={true}
          size="md"
        />
        <div className="flex-1">
          <div className="text-lg font-bold text-white">{subscription.tier.name}</div>
          <div className="text-sm text-gray-400">
            Getting <span className="text-holographic">{subscription.effectiveTierName}</span> perks
          </div>
          <div className="text-sm text-data-cyan mt-1">
            {formatAmount(tier?.biWeeklyAmount || 0)} / bi-weekly
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-void/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">CGT / Cycle</div>
          <div className="text-lg font-bold text-data-gold">
            {subscription.cgtPerCycle.toLocaleString()}
          </div>
        </div>
        <div className="bg-void/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Total Received</div>
          <div className="text-lg font-bold text-data-cyan">
            {subscription.subscriptionCgtReceived.toLocaleString()} CGT
          </div>
        </div>
      </div>

      {/* Next Renewal */}
      {nextRenewal && subscription.status === 'active' && (
        <div className="text-sm text-gray-400 mb-6">
          Next renewal: {nextRenewal.toLocaleDateString(undefined, { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {subscription.status === 'active' && (
          <>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-3 bg-gradient-to-r from-data-cyan to-data-magenta text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Upgrade Plan
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(onPause, 'pause')}
                disabled={isLoading !== null}
                className="flex-1 py-2 border border-data-cyan/30 text-data-cyan rounded-lg hover:bg-data-cyan/10 transition-colors disabled:opacity-50"
              >
                {isLoading === 'pause' ? 'Pausing...' : 'Pause'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isLoading !== null}
                className="flex-1 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {subscription.status === 'paused' && (
          <button
            onClick={() => handleAction(onResume, 'resume')}
            disabled={isLoading !== null}
            className="w-full py-3 bg-gradient-to-r from-data-cyan to-holographic text-void rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading === 'resume' ? 'Resuming...' : 'Resume Subscription'}
          </button>
        )}

        {subscription.status === 'past_due' && (
          <button
            onClick={() => handleAction(onManageBilling, 'billing')}
            disabled={isLoading !== null}
            className="w-full py-3 bg-data-gold text-void rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading === 'billing' ? 'Loading...' : 'Update Payment Method'}
          </button>
        )}

        <button
          onClick={() => handleAction(onManageBilling, 'billing')}
          disabled={isLoading !== null}
          className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          Manage Billing
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="holo-panel p-6 rounded-2xl max-w-md mx-4"
            >
              <h4 className="text-xl font-bold text-white mb-4">Cancel Subscription?</h4>
              <p className="text-gray-400 mb-6">
                You&apos;ll lose access to your subscriber perks at the end of the current billing period.
                Your one-time donation tier and rewards will remain active.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 border border-lavender/30 text-white rounded-xl hover:bg-lavender/10 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => {
                    handleAction(onCancel, 'cancel');
                    setShowCancelConfirm(false);
                  }}
                  disabled={isLoading !== null}
                  className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {isLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="holo-panel p-6 rounded-2xl max-w-lg mx-4"
            >
              <h4 className="text-xl font-bold text-white mb-4">Upgrade Your Plan</h4>
              <div className="space-y-3">
                {[2, 3, 4, 5].filter(level => level > subscription.tier.level).map((level) => {
                  const upgradeTier = getSubscriptionTierByLevel(level);
                  const upgradeEffective = getTierByLevel(upgradeTier?.effectiveTier || 0);
                  if (!upgradeTier) return null;
                  return (
                    <button
                      key={level}
                      onClick={() => {
                        handleAction(() => onUpgrade(level), 'upgrade');
                        setShowUpgradeModal(false);
                      }}
                      disabled={isLoading !== null}
                      className="w-full p-4 flex items-center justify-between bg-ultraviolet/30 hover:bg-ultraviolet/50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div className="font-bold text-white">{upgradeTier.name}</div>
                        <div className="text-sm text-gray-400">
                          Get {upgradeEffective?.name} perks
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-holographic font-bold">
                          {formatAmount(upgradeTier.biWeeklyAmount)}
                        </div>
                        <div className="text-xs text-gray-500">bi-weekly</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
