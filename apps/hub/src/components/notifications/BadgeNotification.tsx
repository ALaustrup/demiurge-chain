'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HolographicBadge } from '@/components/badges';
import type { MintedBadge } from '@/lib/badges/types';

interface BadgeNotificationProps {
  badge: MintedBadge;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

/**
 * Toast notification for newly minted badges
 */
export function BadgeNotification({
  badge,
  isVisible,
  onClose,
  autoCloseDelay = 10000,
}: BadgeNotificationProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(100);

  // Auto-close timer with progress
  useEffect(() => {
    if (!isVisible || autoCloseDelay <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, autoCloseDelay, onClose]);

  const handleViewInWallet = () => {
    onClose();
    router.push('/wallet/badges');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="relative glass-pane rounded-xl p-4 pr-10 max-w-sm overflow-hidden"
               style={{
                 boxShadow: `0 0 40px ${badge.glowColor}30, 0 20px 60px rgba(0,0,0,0.4)`,
               }}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 
                         flex items-center justify-center text-text-tertiary hover:text-text-primary
                         transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex items-center gap-4">
              {/* Badge Preview */}
              <div className="flex-shrink-0">
                <HolographicBadge badge={badge} size="sm" interactive={false} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎉</span>
                  <span className="text-sm font-medium text-text-primary">Badge Unlocked!</span>
                </div>
                <h4 className="text-base font-display font-semibold text-text-primary truncate">
                  {badge.name}
                </h4>
                <p className="text-xs text-text-secondary capitalize">
                  {badge.rarity} {badge.category} Badge
                </p>
              </div>
            </div>

            {/* View Button */}
            <button
              onClick={handleViewInWallet}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 
                         text-sm text-text-secondary hover:text-text-primary hover:bg-white/10
                         transition-all flex items-center justify-center gap-2"
            >
              <span>View in Wallet</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Progress bar */}
            {autoCloseDelay > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <motion.div
                  className="h-full"
                  style={{ 
                    background: badge.glowColor,
                    width: `${progress}%`,
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            )}

            {/* Glow effect */}
            <div 
              className="absolute -inset-px rounded-xl pointer-events-none opacity-30"
              style={{
                background: `linear-gradient(135deg, ${badge.glowColor}20 0%, transparent 50%, ${badge.glowColor}10 100%)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage badge notifications
 */
export function useBadgeNotifications() {
  const [notifications, setNotifications] = useState<MintedBadge[]>([]);
  const [currentNotification, setCurrentNotification] = useState<MintedBadge | null>(null);

  // Process queue - show one at a time
  useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setNotifications(prev => prev.slice(1));
    }
  }, [notifications, currentNotification]);

  const showBadgeNotification = (badge: MintedBadge) => {
    setNotifications(prev => [...prev, badge]);
  };

  const dismissNotification = () => {
    setCurrentNotification(null);
  };

  return {
    currentNotification,
    showBadgeNotification,
    dismissNotification,
    hasPendingNotifications: notifications.length > 0,
  };
}

/**
 * Provider component for badge notifications
 */
export function BadgeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentNotification, dismissNotification } = useBadgeNotifications();

  return (
    <>
      {children}
      {currentNotification && (
        <BadgeNotification
          badge={currentNotification}
          isVisible={!!currentNotification}
          onClose={dismissNotification}
        />
      )}
    </>
  );
}
