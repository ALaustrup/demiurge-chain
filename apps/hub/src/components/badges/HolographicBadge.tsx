'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { MintedBadge, HolographicEffect, BadgeRarity } from '@/lib/badges/types';
import { getBadgeDefinition } from '@/lib/badges/official-badges';

interface HolographicBadgeProps {
  badge: MintedBadge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  showDetails?: boolean;
  interactive?: boolean;
}

const sizeConfig = {
  sm: { width: 80, height: 80, fontSize: 'text-xs', padding: 'p-2' },
  md: { width: 120, height: 120, fontSize: 'text-sm', padding: 'p-3' },
  lg: { width: 180, height: 180, fontSize: 'text-base', padding: 'p-4' },
  xl: { width: 280, height: 280, fontSize: 'text-lg', padding: 'p-6' },
};

const rarityGlowIntensity: Record<BadgeRarity, number> = {
  common: 0.2,
  uncommon: 0.3,
  rare: 0.4,
  epic: 0.6,
  legendary: 0.8,
};

export function HolographicBadge({
  badge,
  size = 'md',
  onClick,
  showDetails = false,
  interactive = true,
}: HolographicBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const config = sizeConfig[size];
  const definition = getBadgeDefinition(badge.type);
  
  // Motion values for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring physics for smooth movement
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  
  // Holographic gradient position
  const holoX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const holoY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);
  
  // Handle mouse movement for 3D tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !interactive) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, interactive]);
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);
  
  // Get holographic effect styles
  const getHoloStyles = () => {
    const effect = badge.holographicEffect;
    const glowIntensity = rarityGlowIntensity[badge.rarity];
    
    const baseStyles: React.CSSProperties = {
      width: config.width,
      height: config.height,
    };
    
    switch (effect) {
      case 'subtle':
        return {
          ...baseStyles,
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%,
              rgba(255, 255, 255, 0.05) 100%
            )
          `,
        };
        
      case 'prismatic':
        return {
          ...baseStyles,
          background: `
            linear-gradient(
              135deg,
              rgba(255, 0, 128, 0.2),
              rgba(255, 140, 0, 0.2),
              rgba(0, 229, 255, 0.2),
              rgba(157, 78, 221, 0.2)
            )
          `,
        };
        
      case 'cosmic':
        return {
          ...baseStyles,
          background: `
            radial-gradient(
              circle at 30% 30%,
              rgba(0, 229, 255, 0.3) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 70% 70%,
              rgba(157, 78, 221, 0.3) 0%,
              transparent 50%
            )
          `,
        };
        
      case 'divine':
        return {
          ...baseStyles,
          background: `
            conic-gradient(
              from 0deg at 50% 50%,
              rgba(255, 0, 128, 0.3),
              rgba(255, 140, 0, 0.3),
              rgba(255, 215, 0, 0.3),
              rgba(0, 255, 148, 0.3),
              rgba(0, 229, 255, 0.3),
              rgba(157, 78, 221, 0.3),
              rgba(255, 0, 128, 0.3)
            )
          `,
        };
        
      default:
        return baseStyles;
    }
  };
  
  return (
    <motion.div
      ref={containerRef}
      className="relative cursor-pointer"
      style={{
        perspective: '1000px',
        width: config.width,
        height: config.height,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {/* 3D Transformed Card */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow Effect Layer */}
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl"
          style={{
            background: badge.glowColor,
            opacity: isHovered ? rarityGlowIntensity[badge.rarity] : rarityGlowIntensity[badge.rarity] * 0.5,
          }}
          animate={{
            scale: isHovered ? 1.2 : 1,
            opacity: isHovered ? rarityGlowIntensity[badge.rarity] : rarityGlowIntensity[badge.rarity] * 0.5,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Main Badge Card */}
        <motion.div
          className="relative w-full h-full rounded-xl overflow-hidden"
          style={{
            background: 'rgba(10, 10, 11, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 0 20px ${badge.glowColor}40,
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 10px 40px rgba(0, 0, 0, 0.4)
            `,
          }}
        >
          {/* Holographic Overlay - moves with mouse */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              ...getHoloStyles(),
              opacity: isHovered ? 0.8 : 0.4,
              mixBlendMode: 'overlay',
            }}
          />
          
          {/* Prismatic Shine Effect */}
          {(badge.holographicEffect === 'prismatic' || 
            badge.holographicEffect === 'cosmic' || 
            badge.holographicEffect === 'divine') && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(
                    ${isHovered ? '135deg' : '180deg'},
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 50%,
                    transparent 100%
                  )
                `,
                backgroundSize: '200% 200%',
                opacity: isHovered ? 0.6 : 0,
              }}
              animate={{
                backgroundPosition: isHovered 
                  ? ['0% 0%', '100% 100%', '0% 0%']
                  : '0% 0%',
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
          
          {/* Rainbow Refraction for Divine Effect */}
          {badge.holographicEffect === 'divine' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  conic-gradient(
                    from 0deg at 50% 50%,
                    #ff0080 0deg,
                    #ff8c00 60deg,
                    #ffd700 120deg,
                    #00ff94 180deg,
                    #00e5ff 240deg,
                    #9d4edd 300deg,
                    #ff0080 360deg
                  )
                `,
                opacity: isHovered ? 0.3 : 0.15,
                mixBlendMode: 'color-dodge',
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
          
          {/* Border Gradient */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: '2px solid transparent',
              background: `${badge.borderGradient} border-box`,
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: isHovered ? 1 : 0.6,
            }}
          />
          
          {/* Badge Content */}
          <div className={`relative z-10 flex flex-col items-center justify-center h-full ${config.padding}`}>
            {/* Badge Image */}
            <div className="relative">
              {badge.animatedUrl && isHovered ? (
                <video
                  src={badge.animatedUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="rounded-lg object-cover"
                  style={{
                    width: config.width * 0.6,
                    height: config.width * 0.6,
                  }}
                />
              ) : (
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="rounded-lg object-cover"
                  style={{
                    width: config.width * 0.6,
                    height: config.width * 0.6,
                    filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                  }}
                />
              )}
              
              {/* Authenticity Seal */}
              {badge.isAuthentic && badge.issuerVerified && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-online flex items-center justify-center"
                  title="Verified Official Badge"
                >
                  <svg className="w-3 h-3 text-void" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Badge Name (only for larger sizes) */}
            {(size === 'lg' || size === 'xl') && (
              <div className="mt-2 text-center">
                <h3 className={`font-display font-semibold text-text-primary ${config.fontSize}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-text-secondary capitalize">
                  {badge.rarity} • {badge.category}
                </p>
              </div>
            )}
          </div>
          
          {/* Scan Line Effect for Legendary */}
          {badge.rarity === 'legendary' && (
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ opacity: 0.1 }}
            >
              <motion.div
                className="absolute w-full h-1"
                style={{
                  background: 'linear-gradient(90deg, transparent, white, transparent)',
                }}
                animate={{
                  top: ['-10%', '110%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )}
        </motion.div>
        
        {/* Floating Particles for Epic/Legendary */}
        {(badge.rarity === 'epic' || badge.rarity === 'legendary') && isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: badge.glowColor,
                  boxShadow: `0 0 4px ${badge.glowColor}`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
      
      {/* Tooltip on hover */}
      {showDetails && isHovered && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-pane px-3 py-2 rounded-lg text-center whitespace-nowrap">
            <p className="text-sm font-medium text-text-primary">{badge.name}</p>
            <p className="text-xs text-text-secondary">
              Block #{badge.mintBlock.toLocaleString()}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Badge Detail Modal
 */
export function BadgeDetailModal({
  badge,
  isOpen,
  onClose,
}: {
  badge: MintedBadge;
  isOpen: boolean;
  onClose: () => void;
}) {
  const definition = getBadgeDefinition(badge.type);
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" />
      
      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-pane rounded-xl p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 
                       flex items-center justify-center text-text-secondary hover:text-text-primary
                       transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          {/* Badge Display */}
          <div className="flex flex-col items-center">
            <HolographicBadge badge={badge} size="xl" interactive={true} />
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-display font-bold text-text-primary">
                {badge.name}
              </h2>
              <p className="mt-1 text-text-secondary capitalize">
                {badge.rarity} {badge.category} Badge
              </p>
            </div>
            
            <p className="mt-4 text-sm text-text-secondary text-center max-w-sm">
              {badge.description}
            </p>
            
            {/* Badge Info Grid */}
            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <InfoItem label="Token ID" value={badge.tokenId.slice(0, 12) + '...'} />
              <InfoItem label="Mint Block" value={`#${badge.mintBlock.toLocaleString()}`} />
              <InfoItem label="Minted" value={new Date(badge.mintedAt).toLocaleDateString()} />
              <InfoItem label="Rarity" value={badge.rarity} capitalize />
              <InfoItem label="Category" value={badge.category} capitalize />
              <InfoItem label="Transferable" value="No (Soulbound)" />
            </div>
            
            {/* Perks Section */}
            {definition?.perks && (
              <div className="mt-6 w-full">
                <h3 className="text-sm font-medium text-text-primary mb-3">Badge Perks</h3>
                <div className="space-y-2">
                  {definition.perks.stakingBonus && (
                    <PerkItem icon="📈" label="Staking Bonus" value={`+${definition.perks.stakingBonus / 100}%`} />
                  )}
                  {definition.perks.xpRateBonus && (
                    <PerkItem icon="⚡" label="XP Rate Bonus" value={`+${definition.perks.xpRateBonus / 100}%`} />
                  )}
                  {definition.perks.energyDiscount && (
                    <PerkItem icon="⚡" label="Energy Discount" value={`${definition.perks.energyDiscount / 100}%`} />
                  )}
                  {definition.perks.freeMints && (
                    <PerkItem icon="🎨" label="Free Mints" value={`${definition.perks.freeMints}`} />
                  )}
                  {definition.perks.systemAccess && (
                    <PerkItem 
                      icon="🔓" 
                      label="System Access" 
                      value={definition.perks.systemAccess.length + ' systems'} 
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Authenticity Badge */}
            {badge.isAuthentic && badge.issuerVerified && (
              <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-status-online/10 border border-status-online/30">
                <svg className="w-4 h-4 text-status-online" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <span className="text-sm text-status-online font-medium">
                  Verified Official Badge
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoItem({ 
  label, 
  value, 
  capitalize 
}: { 
  label: string; 
  value: string; 
  capitalize?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] rounded-lg px-3 py-2">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className={`text-sm text-text-primary font-mono ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function PerkItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: string; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="text-sm text-neon-cyan font-mono">{value}</span>
    </div>
  );
}
