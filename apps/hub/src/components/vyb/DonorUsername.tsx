'use client';

import { motion } from 'framer-motion';

interface DonorUsernameProps {
  displayName: string;
  qorId?: string;
  chatPrivileges?: string[];
  donorTier?: number;
  className?: string;
  showBadge?: boolean;
}

// Tier colors for colored_name privilege
const tierColors: Record<number, string> = {
  1: 'text-amber-400', // Supporter - Bronze
  2: 'text-gray-300', // Champion - Silver
  3: 'text-yellow-400', // Guardian - Gold
  4: 'text-purple-300', // Archon - Platinum
  5: 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500', // Godsent - Rainbow
};

// Badge emojis by tier
const tierBadges: Record<number, string> = {
  1: '🌟',
  2: '⚔️',
  3: '🛡️',
  4: '👑',
  5: '✨',
};

export function DonorUsername({
  displayName,
  qorId,
  chatPrivileges = [],
  donorTier = 0,
  className = '',
  showBadge = true,
}: DonorUsernameProps) {
  const hasPrivilege = (priv: string) => 
    chatPrivileges.includes(priv) || chatPrivileges.includes('all');

  const hasColoredName = hasPrivilege('colored_name') && donorTier > 0;
  const hasAnimatedName = hasPrivilege('animated_name');
  const hasBadgeFlair = hasPrivilege('badge_flair') && showBadge;
  
  // Base text classes
  let textClasses = className;
  
  if (hasColoredName) {
    textClasses += ` ${tierColors[donorTier] || ''}`;
  }

  // Animated name effect - glowing/pulsing for higher tiers
  const animatedNameVariants = {
    animate: donorTier >= 5 ? {
      // Rainbow shimmer for Godsent
      filter: [
        'hue-rotate(0deg)',
        'hue-rotate(180deg)',
        'hue-rotate(360deg)',
      ],
    } : donorTier >= 4 ? {
      // Purple glow for Archon
      textShadow: [
        '0 0 10px rgba(168, 85, 247, 0.5)',
        '0 0 20px rgba(168, 85, 247, 0.8)',
        '0 0 10px rgba(168, 85, 247, 0.5)',
      ],
    } : {
      // Subtle glow for others
      textShadow: [
        '0 0 5px currentColor',
        '0 0 15px currentColor',
        '0 0 5px currentColor',
      ],
    },
  };

  const NameComponent = hasAnimatedName ? motion.span : 'span';
  const nameProps = hasAnimatedName ? {
    animate: 'animate',
    variants: animatedNameVariants,
    transition: {
      duration: donorTier >= 5 ? 3 : 2,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  } : {};

  return (
    <span className="inline-flex items-center gap-1">
      {/* Badge flair */}
      {hasBadgeFlair && donorTier > 0 && (
        <motion.span
          className="text-sm"
          animate={donorTier >= 5 ? { 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {tierBadges[donorTier]}
        </motion.span>
      )}
      
      {/* Username */}
      <NameComponent
        className={`font-grunge-alt ${textClasses}`}
        {...nameProps}
      >
        {displayName}
      </NameComponent>

      {/* Subscriber indicator */}
      {chatPrivileges.includes('subscriber') && (
        <span className="text-xs text-data-cyan font-bold">+</span>
      )}
    </span>
  );
}

// Hook to fetch donor status for a user
export function useDonorStatus(qorId?: string) {
  // This would fetch from the API in a real implementation
  // For now, return cached/default values
  return {
    donorTier: 0,
    chatPrivileges: [] as string[],
    isLoading: false,
  };
}
