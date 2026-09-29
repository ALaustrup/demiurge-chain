/**
 * Official Demiurge-Cloud Badge Definitions
 * 
 * These are the only badges that can be officially issued by the chain.
 * Each badge has specific visual effects and perks.
 */

import type { OfficialBadge, OfficialBadgeType } from './types';

/**
 * Base URL for official badge assets
 */
export const BADGE_ASSET_BASE = '/assets/badges/official';

/**
 * All official badge definitions
 */
export const OFFICIAL_BADGES: Record<OfficialBadgeType, OfficialBadge> = {
  // ============================================
  // DONOR TIER BADGES
  // ============================================
  
  DONOR_SUPPORTER: {
    type: 'DONOR_SUPPORTER',
    name: 'Supporter',
    description: 'A valued supporter of the Demiurge-Cloud ecosystem. This badge represents your commitment to building the future of decentralized technology.',
    category: 'donor',
    rarity: 'uncommon',
    imageUrl: `${BADGE_ASSET_BASE}/donor-tier-1-supporter.png`,
    animatedUrl: `${BADGE_ASSET_BASE}/donor-tier-1-supporter.mp4`,
    holographicEffect: 'subtle',
    glowColor: '#CD7F32', // Bronze
    borderGradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 200,      // +2%
      xpRateBonus: 500,       // +5%
      chatPrivileges: ['colored_name'],
    },
  },
  
  DONOR_CHAMPION: {
    type: 'DONOR_CHAMPION',
    name: 'Champion',
    description: 'A dedicated champion of the Demiurge ecosystem. Your significant contribution helps drive innovation and growth across the platform.',
    category: 'donor',
    rarity: 'rare',
    imageUrl: `${BADGE_ASSET_BASE}/donor-tier-2-champion.png`,
    holographicEffect: 'subtle',
    glowColor: '#C0C0C0', // Silver
    borderGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #E8E8E8 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 400,      // +4%
      xpRateBonus: 1000,      // +10%
      freeMints: 10,
      chatPrivileges: ['colored_name', 'animated_name'],
    },
  },
  
  DONOR_GUARDIAN: {
    type: 'DONOR_GUARDIAN',
    name: 'Guardian',
    description: 'An elite guardian of the Demiurge realm. Your exceptional support grants you access to exclusive benefits and premium features.',
    category: 'donor',
    rarity: 'epic',
    imageUrl: `${BADGE_ASSET_BASE}/donor-tier-3-guardian.png`,
    holographicEffect: 'prismatic',
    glowColor: '#FFD700', // Gold
    borderGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFEC8B 75%, #FFD700 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 600,      // +6%
      xpRateBonus: 1500,      // +15%
      energyDiscount: 1000,      // 10%
      freeMints: 25,
      chatPrivileges: ['colored_name', 'animated_name', 'custom_emotes'],
    },
  },
  
  DONOR_ARCHITECT: {
    type: 'DONOR_ARCHITECT',
    name: 'Architect',
    description: 'A master architect of the Demiurge cosmos. You shape the very foundation of our decentralized universe with your extraordinary patronage.',
    category: 'donor',
    rarity: 'epic',
    imageUrl: `${BADGE_ASSET_BASE}/donor-tier-4-architect.png`,
    holographicEffect: 'cosmic',
    glowColor: '#9D4EDD', // Purple
    borderGradient: 'linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 25%, #00E5FF 50%, #9D4EDD 75%, #E040FB 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 800,      // +8%
      xpRateBonus: 2000,      // +20%
      energyDiscount: 1000,      // 10%
      freeMints: 50,
      chatPrivileges: ['colored_name', 'animated_name', 'custom_emotes', 'badge_flair'],
    },
  },
  
  DONOR_GODSENT: {
    type: 'DONOR_GODSENT',
    name: 'Godsent',
    description: 'A divine benefactor of the Demiurge realm. Your legendary contribution transcends mortal limits, granting you supreme privileges across all systems.',
    category: 'donor',
    rarity: 'legendary',
    imageUrl: `${BADGE_ASSET_BASE}/donor-tier-5-godsent.png`,
    holographicEffect: 'divine',
    glowColor: '#00E5FF', // Cyan with rainbow
    borderGradient: 'linear-gradient(135deg, #FF0080 0%, #FF8C00 20%, #FFD700 40%, #00FF94 60%, #00E5FF 80%, #9D4EDD 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 1000,     // +10%
      xpRateBonus: 2500,      // +25%
      energyDiscount: 1000,      // 10%
      freeMints: 100,
      chatPrivileges: ['all'],
    },
  },
  
  // ============================================
  // CREATOR BADGES
  // ============================================
  
  MUSIC_ARTIST: {
    type: 'MUSIC_ARTIST',
    name: 'Music Artist',
    description: 'An officially verified music artist on Demiurge-Cloud. This badge grants access to the QOR Music distribution platform for releasing singles, EPs, and albums on-chain.',
    category: 'creator',
    rarity: 'rare',
    imageUrl: `${BADGE_ASSET_BASE}/music-artist-badge.png`,
    animatedUrl: `${BADGE_ASSET_BASE}/music-artist-badge.mp4`,
    holographicEffect: 'prismatic',
    glowColor: '#00E5FF', // Cyan
    borderGradient: 'linear-gradient(135deg, #00E5FF 0%, #9D4EDD 50%, #00E5FF 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      systemAccess: ['music_releases', 'artist_profile', 'royalty_dashboard'],
    },
  },
  
  GAME_DEVELOPER: {
    type: 'GAME_DEVELOPER',
    name: 'Game Developer',
    description: 'An officially verified game developer on Demiurge-Cloud. This badge grants access to submit games, integrate DRC-369 assets, and utilize on-chain game services.',
    category: 'creator',
    rarity: 'rare',
    imageUrl: `${BADGE_ASSET_BASE}/game-developer-badge.png`,
    holographicEffect: 'prismatic',
    glowColor: '#00FF94', // Green
    borderGradient: 'linear-gradient(135deg, #00FF94 0%, #00E5FF 50%, #00FF94 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      systemAccess: ['game_submission', 'developer_api', 'asset_integration'],
    },
  },
  
  // ============================================
  // ACHIEVEMENT BADGES
  // ============================================
  
  EARLY_ADOPTER: {
    type: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'A pioneer who joined Demiurge-Cloud in its earliest days. This badge commemorates your faith in our vision before the world knew our name.',
    category: 'achievement',
    rarity: 'epic',
    imageUrl: `${BADGE_ASSET_BASE}/early-adopter-badge.png`,
    holographicEffect: 'cosmic',
    glowColor: '#FFB800', // Amber
    borderGradient: 'linear-gradient(135deg, #FFB800 0%, #00E5FF 50%, #FFB800 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      xpRateBonus: 500,       // +5% permanent
      chatPrivileges: ['pioneer_flair'],
    },
  },
  
  VALIDATOR: {
    type: 'VALIDATOR',
    name: 'Validator',
    description: 'An active validator securing the Demiurge network. This badge signifies your critical role in maintaining consensus and protecting the integrity of the blockchain.',
    category: 'achievement',
    rarity: 'legendary',
    imageUrl: `${BADGE_ASSET_BASE}/validator-badge.png`,
    holographicEffect: 'cosmic',
    glowColor: '#00FF94', // Status green
    borderGradient: 'linear-gradient(135deg, #00FF94 0%, #00E5FF 25%, #9D4EDD 50%, #00E5FF 75%, #00FF94 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      systemAccess: ['validator_dashboard', 'governance_voting'],
      chatPrivileges: ['validator_badge'],
    },
  },
  
  GENESIS_MEMBER: {
    type: 'GENESIS_MEMBER',
    name: 'Genesis Member',
    description: 'A founding member present at the genesis block. This badge is the rarest honor, bestowed only upon those who witnessed the birth of the Demiurge cosmos.',
    category: 'achievement',
    rarity: 'legendary',
    imageUrl: `${BADGE_ASSET_BASE}/early-adopter-badge.png`, // Using early adopter for now
    holographicEffect: 'divine',
    glowColor: '#FFFFFF',
    borderGradient: 'linear-gradient(135deg, #FFFFFF 0%, #00E5FF 25%, #9D4EDD 50%, #FFD700 75%, #FFFFFF 100%)',
    soulbound: true,
    transferable: false,
    perks: {
      stakingBonus: 500,      // +5% permanent
      xpRateBonus: 1000,      // +10% permanent
      chatPrivileges: ['genesis_crown'],
    },
  },
};

/**
 * Get badge definition by type
 */
export function getBadgeDefinition(type: OfficialBadgeType): OfficialBadge | null {
  return OFFICIAL_BADGES[type] || null;
}

/**
 * Get all badges in a category
 */
export function getBadgesByCategory(category: OfficialBadge['category']): OfficialBadge[] {
  return Object.values(OFFICIAL_BADGES).filter(badge => badge.category === category);
}

/**
 * Get donor badge type from tier level
 */
export function getDonorBadgeType(tierLevel: number): OfficialBadgeType | null {
  const mapping: Record<number, OfficialBadgeType> = {
    1: 'DONOR_SUPPORTER',
    2: 'DONOR_CHAMPION',
    3: 'DONOR_GUARDIAN',
    4: 'DONOR_ARCHITECT',
    5: 'DONOR_GODSENT',
  };
  return mapping[tierLevel] || null;
}
