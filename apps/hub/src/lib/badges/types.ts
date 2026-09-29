/**
 * Official Demiurge-Cloud Badge Types
 * 
 * DRC-369 Soulbound NFT Badge System
 * These badges are NON-TRANSFERABLE and provide on-chain authenticity verification.
 */

/**
 * Badge categories for organization
 */
export type BadgeCategory = 
  | 'donor'      // Donation tier badges
  | 'creator'    // Music Artist, Game Developer, etc.
  | 'achievement' // Early Adopter, Validator, etc.
  | 'special';   // Limited edition, event badges

/**
 * Official badge types that can be issued
 */
export type OfficialBadgeType =
  // Donor tiers
  | 'DONOR_SUPPORTER'
  | 'DONOR_CHAMPION'
  | 'DONOR_GUARDIAN'
  | 'DONOR_ARCHITECT'
  | 'DONOR_GODSENT'
  // Creator badges
  | 'MUSIC_ARTIST'
  | 'GAME_DEVELOPER'
  // Achievement badges
  | 'EARLY_ADOPTER'
  | 'VALIDATOR'
  | 'GENESIS_MEMBER';

/**
 * Badge rarity levels (affects visual effects)
 */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Holographic effect types for badge display
 */
export type HolographicEffect = 
  | 'none'
  | 'subtle'      // Slight shimmer
  | 'prismatic'   // Rainbow refraction
  | 'cosmic'      // Particle effects
  | 'divine';     // Full holographic + particles

/**
 * Official badge definition
 */
export interface OfficialBadge {
  type: OfficialBadgeType;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  
  // Visual assets
  imageUrl: string;
  animatedUrl?: string; // Optional video/animated version
  
  // Display effects
  holographicEffect: HolographicEffect;
  glowColor: string;
  borderGradient: string;
  
  // On-chain properties
  soulbound: true; // All official badges are soulbound
  transferable: false;
  
  // Perks granted by this badge
  perks?: {
    stakingBonus?: number;     // Basis points
    xpRateBonus?: number;      // Basis points
    energyDiscount?: number;    // Basis points
    freeMints?: number;
    chatPrivileges?: string[];
    systemAccess?: string[];   // e.g., 'music_releases', 'game_submission'
  };
}

/**
 * DRC-369 NFT Metadata structure for badges
 */
export interface DRC369BadgeMetadata {
  // Standard NFT fields
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url: string;
  
  // DRC-369 specific fields
  drc369: {
    version: '1.0';
    standard: 'DRC-369';
    
    // Soulbound properties
    soulbound: true;
    transferable: false;
    
    // Official issuer verification
    issuer: {
      address: string;        // Official Demiurge issuer address
      name: 'Demiurge-Cloud';
      verified: true;
    };
    
    // Cryptographic authenticity
    authenticity: {
      // Hash of (badge_type + recipient + timestamp + secret_salt)
      // Only the chain can verify this signature
      issuerSignature: string;
      
      // Hidden watermark - SHA256 of official issuer key + badge data
      // This cannot be reproduced without the official key
      watermark: string;
      
      // Timestamp of issuance
      issuedAt: number;
      
      // Block number when minted
      mintBlock: number;
    };
    
    // Badge-specific data
    badge: {
      type: OfficialBadgeType;
      category: BadgeCategory;
      rarity: BadgeRarity;
      holographicEffect: HolographicEffect;
    };
  };
  
  // Standard attributes for marketplace display
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'date' | 'boost_percentage';
  }>;
  
  // Properties for rendering
  properties: {
    glowColor: string;
    borderGradient: string;
    category: BadgeCategory;
  };
}

/**
 * Badge mint request
 */
export interface BadgeMintRequest {
  recipientAddress: string;
  recipientQorId: string;
  badgeType: OfficialBadgeType;
  
  // Optional context for the mint
  context?: {
    donationId?: string;
    artistProfileId?: string;
    gameId?: string;
    achievementId?: string;
  };
}

/**
 * Badge mint result
 */
export interface BadgeMintResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  metadata?: DRC369BadgeMetadata;
  error?: string;
}

/**
 * User's badge collection
 */
export interface UserBadgeCollection {
  owner: string;
  qorId: string;
  badges: MintedBadge[];
  totalBadges: number;
  categories: {
    donor: number;
    creator: number;
    achievement: number;
    special: number;
  };
}

/**
 * A minted badge in user's collection
 */
export interface MintedBadge {
  tokenId: string;
  type: OfficialBadgeType;
  name: string;
  description: string;
  
  // Visual
  imageUrl: string;
  animatedUrl?: string;
  
  // Metadata
  category: BadgeCategory;
  rarity: BadgeRarity;
  holographicEffect: HolographicEffect;
  glowColor: string;
  borderGradient: string;
  
  // Chain data
  mintedAt: number;
  mintBlock: number;
  txHash: string;
  
  // Verification
  isAuthentic: boolean;
  issuerVerified: boolean;
}
