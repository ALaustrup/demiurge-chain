'use client';

import { useState, useEffect } from 'react';
import { SophiaBadge } from './SophiaBadge';
import type { BanStatus } from '@/lib/vyb/sophia-types';

interface ModerationOverlayProps {
  banStatus: BanStatus;
  onAppeal?: () => void;
}

/**
 * Ghost Mode overlay shown to banned users
 * They can still read but cannot post
 */
export function ModerationOverlay({ banStatus, onAppeal }: ModerationOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!banStatus.banExpiresAt) {
      setTimeRemaining('Permanent');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(banStatus.banExpiresAt!);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [banStatus.banExpiresAt]);

  if (!banStatus.isBanned) return null;

  const getBanLevelInfo = (level: number) => {
    const levels = [
      { name: 'Warning', icon: '⚠️', color: 'yellow' },
      { name: 'Warning', icon: '⚠️', color: 'yellow' },
      { name: 'Time Out', icon: '⏱️', color: 'orange' },
      { name: 'Short Ban', icon: '🚫', color: 'orange' },
      { name: 'Cooling Off', icon: '❄️', color: 'red' },
      { name: 'Suspension', icon: '⛔', color: 'red' },
      { name: 'Day Rest', icon: '🌙', color: 'red' },
      { name: 'Full Ban', icon: '🔒', color: 'darkred' },
      { name: 'Exile', icon: '💀', color: 'black' },
    ];
    return levels[level] || levels[0];
  };

  const levelInfo = getBanLevelInfo(banStatus.banLevel);

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(139,0,0,0.1) 100%)',
      }}
    >
      {/* Floating Ghost Mode Banner */}
      <div 
        className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(139,0,0,0.9), rgba(100,0,0,0.95))',
          border: '1px solid rgba(255,100,100,0.3)',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: '0 10px 40px rgba(139,0,0,0.3)',
          maxWidth: '500px',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <SophiaBadge size="md" animated={true} />
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'rgba(139,0,0,0.9)', border: '1px solid rgba(255,100,100,0.5)' }}
            >
              {levelInfo.icon}
            </div>
          </div>
          <div>
            <h3 className="font-grunge text-xl text-red-300">Ghost Mode Active</h3>
            <p className="text-red-400/70 text-sm">{levelInfo.name} (Level {banStatus.banLevel + 1}/9)</p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-4">
          <p className="text-white/90 font-body text-sm leading-relaxed">
            Your posting privileges have been suspended due to Protocol violations.
          </p>
          {banStatus.banReason && (
            <p className="text-red-300/80 text-sm mt-2">
              <strong>Reason:</strong> {banStatus.banReason}
            </p>
          )}
        </div>

        {/* Timer */}
        <div 
          className="rounded-lg p-4 mb-4"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,100,100,0.2)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-red-300/70 text-sm">Posting restored in:</span>
            <span className="font-grunge text-2xl text-white">
              {timeRemaining}
            </span>
          </div>
          {/* Progress bar */}
          {banStatus.banExpiresAt && banStatus.banStartedAt && (
            <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000"
                style={{
                  width: `${Math.max(0, 100 - (
                    (new Date().getTime() - new Date(banStatus.banStartedAt).getTime()) /
                    (new Date(banStatus.banExpiresAt).getTime() - new Date(banStatus.banStartedAt).getTime())
                  ) * 100)}%`
                }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-red-300/60 space-y-1">
          <p>✧ You can still read posts and messages</p>
          <p>✧ Your content remains visible to others</p>
          <p>✧ Reflection leads to restoration</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onAppeal && (
            <button
              onClick={onAppeal}
              className="flex-1 py-2 rounded-lg text-sm font-body transition-colors"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              📜 View Guidelines
            </button>
          )}
          <button
            className="flex-1 py-2 rounded-lg text-sm font-body transition-colors"
            style={{
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              color: '#FFD700',
            }}
          >
            💬 Contact Sophia
          </button>
        </div>

        {/* On-chain proof */}
        {banStatus.banTxHash && (
          <p className="text-xs text-red-300/40 mt-4 text-center">
            On-chain record: {banStatus.banTxHash.slice(0, 10)}...
          </p>
        )}
      </div>

      {/* Red vignette effect */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(139,0,0,0.3)',
        }}
      />
    </div>
  );
}

/**
 * Compact ban indicator for UI elements
 */
export function BanIndicator({ banStatus }: { banStatus: BanStatus }) {
  if (!banStatus.isBanned) return null;

  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
      style={{
        background: 'rgba(139,0,0,0.3)',
        border: '1px solid rgba(255,100,100,0.3)',
        color: '#ff6b6b',
      }}
    >
      <span>👻</span>
      <span>Ghost Mode</span>
    </div>
  );
}
