'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HolographicBadge, BadgeDetailModal } from './HolographicBadge';
import type { MintedBadge, UserBadgeCollection, BadgeCategory } from '@/lib/badges/types';
import { useAuth } from '@/contexts/AuthContext';

interface ChainBadgesCollectionProps {
  address?: string;
  showTitle?: boolean;
  maxColumns?: number;
}

const categoryInfo: Record<BadgeCategory, { label: string; icon: string; color: string }> = {
  donor: { label: 'Supporter Badges', icon: '💎', color: '#FFD700' },
  creator: { label: 'Creator Badges', icon: '🎨', color: '#00E5FF' },
  achievement: { label: 'Achievement Badges', icon: '🏆', color: '#00FF94' },
  special: { label: 'Special Badges', icon: '✨', color: '#9D4EDD' },
};

export function ChainBadgesCollection({
  address,
  showTitle = true,
  maxColumns = 4,
}: ChainBadgesCollectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [collection, setCollection] = useState<UserBadgeCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<MintedBadge | null>(null);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');

  // Use provided address or current user's address
  const targetAddress = address || user?.on_chain_address || user?.on_chain?.address;

  useEffect(() => {
    async function fetchBadges() {
      if (!targetAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/badges/${targetAddress}`);
        const data = await response.json();

        if (data.success) {
          setCollection(data.collection);
        } else {
          setError(data.error || 'Failed to fetch badges');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [targetAddress]);

  // Filter badges by category
  const filteredBadges = collection?.badges.filter(badge => 
    activeCategory === 'all' || badge.category === activeCategory
  ) || [];

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin" />
        </div>
        <p className="mt-4 text-text-secondary text-sm">Loading badges...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated && !address) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-display text-text-primary">Authentication Required</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Connect your wallet to view your badge collection.
        </p>
      </div>
    );
  }

  // No badges
  if (!collection || collection.totalBadges === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">🎖️</span>
        </div>
        <h3 className="text-lg font-display text-text-primary">No Badges Yet</h3>
        <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
          Badges are earned through various activities like donations, 
          becoming a creator, or reaching achievements.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a 
            href="/donate" 
            className="cmd-button text-sm"
          >
            Support the Project
          </a>
          <a 
            href="/music" 
            className="cmd-button text-sm !bg-transparent !border-white/10"
          >
            Become an Artist
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold text-text-primary flex items-center gap-2">
              <span className="text-neon-cyan">⬡</span>
              Chain Badges
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {collection.totalBadges} Official Badge{collection.totalBadges !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Category Stats */}
          <div className="hidden md:flex items-center gap-3">
            {Object.entries(collection.categories).map(([cat, count]) => {
              if (count === 0) return null;
              const info = categoryInfo[cat as BadgeCategory];
              return (
                <div 
                  key={cat}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5"
                >
                  <span className="text-sm">{info.icon}</span>
                  <span className="text-xs text-text-secondary">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <CategoryButton
          label="All Badges"
          count={collection.totalBadges}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          color="#00E5FF"
        />
        {Object.entries(categoryInfo).map(([cat, info]) => {
          const count = collection.categories[cat as BadgeCategory];
          if (count === 0) return null;
          return (
            <CategoryButton
              key={cat}
              label={info.label}
              count={count}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat as BadgeCategory)}
              color={info.color}
              icon={info.icon}
            />
          );
        })}
      </div>

      {/* Badge Grid */}
      <motion.div 
        className={`grid gap-4`}
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge, index) => (
            <motion.div
              key={badge.tokenId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <HolographicBadge
                badge={badge}
                size="md"
                onClick={() => setSelectedBadge(badge)}
                showDetails={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty filter result */}
      {filteredBadges.length === 0 && activeCategory !== 'all' && (
        <div className="text-center py-8">
          <p className="text-text-secondary text-sm">
            No badges in this category yet.
          </p>
        </div>
      )}

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            isOpen={!!selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryButton({
  label,
  count,
  active,
  onClick,
  color,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-300 ease-out-expo
        ${active 
          ? 'bg-white/10 text-text-primary' 
          : 'bg-white/[0.02] text-text-secondary hover:bg-white/5 hover:text-text-primary'
        }
      `}
      style={{
        boxShadow: active ? `0 0 20px ${color}20` : 'none',
        borderColor: active ? `${color}40` : 'transparent',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <span className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {label}
        <span 
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: active ? `${color}20` : 'rgba(255,255,255,0.05)',
            color: active ? color : 'inherit',
          }}
        >
          {count}
        </span>
      </span>
      
      {/* Active indicator */}
      {active && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
          style={{ background: color }}
          layoutId="categoryIndicator"
        />
      )}
    </button>
  );
}

/**
 * Compact badge row for wallet/profile sidebar
 */
export function BadgeRow({ badges }: { badges: MintedBadge[] }) {
  if (badges.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {badges.slice(0, 5).map(badge => (
        <HolographicBadge
          key={badge.tokenId}
          badge={badge}
          size="sm"
          interactive={false}
        />
      ))}
      {badges.length > 5 && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <span className="text-xs text-text-secondary">+{badges.length - 5}</span>
        </div>
      )}
    </div>
  );
}
