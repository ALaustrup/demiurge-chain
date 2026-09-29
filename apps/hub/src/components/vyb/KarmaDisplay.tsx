'use client';

import { useState, useEffect } from 'react';
import { sophiaAgent } from '@/lib/vyb/sophia-agent';
import { KARMA_TIERS, type KarmaTier } from '@/lib/vyb/sophia-types';

interface KarmaDisplayProps {
  qorId: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showPermissions?: boolean;
}

/**
 * Display user's karma (reputation) with tier indicator
 */
export function KarmaDisplay({ 
  qorId, 
  size = 'md',
  showProgress = true,
  showPermissions = false,
}: KarmaDisplayProps) {
  const [karma, setKarma] = useState<number>(0);
  const [tier, setTier] = useState<KarmaTier>(KARMA_TIERS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKarma();
  }, [qorId]);

  const loadKarma = async () => {
    setIsLoading(true);
    try {
      const karmaValue = await sophiaAgent.getKarma(qorId);
      const userTier = await sophiaAgent.getKarmaTier(qorId);
      setKarma(karmaValue);
      setTier(userTier);
    } catch (error) {
      console.error('Failed to load karma:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressToNextTier = () => {
    const currentTierIndex = KARMA_TIERS.findIndex(t => t.name === tier.name);
    const nextTier = KARMA_TIERS[currentTierIndex + 1];
    
    if (!nextTier) return 100; // Max tier
    
    const tierRange = nextTier.minKarma - tier.minKarma;
    const progress = ((karma - tier.minKarma) / tierRange) * 100;
    return Math.min(progress, 100);
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} animate-pulse flex items-center gap-2`}>
        <div className="w-6 h-6 bg-gray-700 rounded-full" />
        <div className="w-16 h-4 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Display */}
      <div className="flex items-center gap-2">
        {/* Tier Icon */}
        <div 
          className={`${iconSizes[size]} flex items-center justify-center`}
          title={`${tier.name} Tier`}
        >
          {tier.icon}
        </div>

        {/* Karma Value */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span 
              className={`font-grunge ${sizeClasses[size]}`}
              style={{ color: tier.color }}
            >
              {karma.toLocaleString()}
            </span>
            <span className={`text-gray-500 ${sizeClasses[size]}`}>
              Karma
            </span>
          </div>
          <span 
            className="text-xs"
            style={{ color: tier.color }}
          >
            {tier.name}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{tier.minKarma}</span>
            <span>{tier.maxKarma === Infinity ? '∞' : tier.maxKarma}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${getProgressToNextTier()}%`,
                background: `linear-gradient(to right, ${tier.color}, ${tier.color}88)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Permissions */}
      {showPermissions && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tier.permissions.map((perm) => (
            <span 
              key={perm}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: `${tier.color}20`,
                border: `1px solid ${tier.color}40`,
                color: tier.color,
              }}
            >
              {perm.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact karma badge for profile cards
 */
export function KarmaBadge({ karma, size = 'md' }: { karma: number; size?: 'sm' | 'md' }) {
  const tier = KARMA_TIERS.find(t => karma >= t.minKarma && karma <= t.maxKarma) || KARMA_TIERS[0];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-body ${sizeClasses[size]}`}
      style={{
        background: `${tier.color}20`,
        border: `1px solid ${tier.color}40`,
        color: tier.color,
      }}
      title={`${tier.name} - ${karma} Karma`}
    >
      <span>{tier.icon}</span>
      <span>{karma}</span>
    </span>
  );
}

/**
 * Karma change animation
 */
export function KarmaChange({ amount, reason }: { amount: number; reason: string }) {
  const isPositive = amount > 0;

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg animate-fade-in ${
        isPositive ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'
      } border`}
    >
      <span className={`font-grunge ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{amount}
      </span>
      <span className="text-gray-400 text-sm">Karma</span>
      <span className="text-gray-500 text-xs">• {reason}</span>
    </div>
  );
}
