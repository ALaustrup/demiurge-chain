/**
 * Demiurge Donation Tier Definitions
 * 
 * Defines all tier thresholds, rewards, and subscription pricing.
 */

export interface DonationTier {
  level: number;
  name: string;
  minAmount: number; // USD cents
  maxAmount: number | null; // null = unlimited
  cgtReward: number;
  stakingBonusBps: number; // basis points (200 = 2%)
  xpRateBonusBps: number;
  energyDiscountBps: number;
  freeMints: number;
  chatPrivileges: string[];
  badgeImage: string;
  badgeColor: string;
  description: string;
}

export interface SubscriptionTier {
  level: number;
  name: string;
  biWeeklyAmount: number; // USD cents
  effectiveTier: number; // Gets perks of this tier (level + 1)
  cgtPerCycle: number;
  freeMintsCycle: number; // Free mints replenished each cycle
  badgeSuffix: string; // e.g., "+" for subscriber badge variant
}

// One-time donation tiers
export const DONATION_TIERS: DonationTier[] = [
  {
    level: 1,
    name: 'Supporter',
    minAmount: 100, // $1.00
    maxAmount: 5000, // $50.00
    cgtReward: 200,
    stakingBonusBps: 200, // +2%
    xpRateBonusBps: 500, // +5%
    energyDiscountBps: 0,
    freeMints: 0,
    chatPrivileges: ['colored_name'],
    badgeImage: 'ipfs://bafkreie5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfa', // Bronze
    badgeColor: '#CD7F32',
    description: 'Entry-level supporter with basic perks',
  },
  {
    level: 2,
    name: 'Champion',
    minAmount: 5100, // $51.00
    maxAmount: 15000, // $150.00
    cgtReward: 500,
    stakingBonusBps: 400, // +4%
    xpRateBonusBps: 1000, // +10%
    energyDiscountBps: 0,
    freeMints: 10,
    chatPrivileges: ['colored_name', 'animated_name'],
    badgeImage: 'ipfs://bafkreif5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfb', // Silver
    badgeColor: '#C0C0C0',
    description: 'Dedicated supporter with enhanced rewards',
  },
  {
    level: 3,
    name: 'Guardian',
    minAmount: 15100, // $151.00
    maxAmount: 50000, // $500.00
    cgtReward: 1000,
    stakingBonusBps: 600, // +6%
    xpRateBonusBps: 1500, // +15%
    energyDiscountBps: 1000, // 10% energy discount
    freeMints: 25,
    chatPrivileges: ['colored_name', 'animated_name', 'custom_emotes'],
    badgeImage: 'ipfs://bafkreig5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfc', // Gold
    badgeColor: '#FFD700',
    description: 'Elite guardian with premium benefits',
  },
  {
    level: 4,
    name: 'Archon',
    minAmount: 50100, // $501.00
    maxAmount: 100000, // $1000.00
    cgtReward: 2500,
    stakingBonusBps: 800, // +8%
    xpRateBonusBps: 2000, // +20%
    energyDiscountBps: 1000,
    freeMints: 50,
    chatPrivileges: ['colored_name', 'animated_name', 'custom_emotes', 'badge_flair'],
    badgeImage: 'ipfs://bafkreih5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfd', // Platinum
    badgeColor: '#E5E4E2',
    description: 'High-tier patron with exclusive access',
  },
  {
    level: 5,
    name: 'Godsent',
    minAmount: 100100, // $1001.00
    maxAmount: null, // Unlimited
    cgtReward: 5000,
    stakingBonusBps: 1000, // +10%
    xpRateBonusBps: 2500, // +25%
    energyDiscountBps: 1000,
    freeMints: 100,
    chatPrivileges: ['all'],
    badgeImage: 'ipfs://bafkreii5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfe', // Rainbow/Holographic
    badgeColor: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
    description: 'Legendary benefactor with all privileges',
  },
];

// Subscription tiers (bi-weekly payments)
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    level: 1,
    name: 'Supporter+',
    biWeeklyAmount: 2500, // $25.00
    effectiveTier: 2, // Gets Champion perks
    cgtPerCycle: 250,
    freeMintsCycle: 5,
    badgeSuffix: '+',
  },
  {
    level: 2,
    name: 'Champion+',
    biWeeklyAmount: 7500, // $75.00
    effectiveTier: 3, // Gets Guardian perks
    cgtPerCycle: 500,
    freeMintsCycle: 12,
    badgeSuffix: '+',
  },
  {
    level: 3,
    name: 'Guardian+',
    biWeeklyAmount: 25000, // $250.00
    effectiveTier: 4, // Gets Archon perks
    cgtPerCycle: 1250,
    freeMintsCycle: 25,
    badgeSuffix: '+',
  },
  {
    level: 4,
    name: 'Archon+',
    biWeeklyAmount: 50000, // $500.00
    effectiveTier: 5, // Gets Godsent perks
    cgtPerCycle: 2500,
    freeMintsCycle: 50,
    badgeSuffix: '+',
  },
  {
    level: 5,
    name: 'Godsent+',
    biWeeklyAmount: 100000, // $1000.00
    effectiveTier: 5, // Gets Godsent perks + exclusives
    cgtPerCycle: 5000,
    freeMintsCycle: 100,
    badgeSuffix: '++',
  },
];

/**
 * Get tier level from donation amount in cents
 */
export function getTierFromAmount(amountCents: number): number {
  for (let i = DONATION_TIERS.length - 1; i >= 0; i--) {
    if (amountCents >= DONATION_TIERS[i].minAmount) {
      return DONATION_TIERS[i].level;
    }
  }
  return 0;
}

/**
 * Get tier details by level
 */
export function getTierByLevel(level: number): DonationTier | null {
  return DONATION_TIERS.find(t => t.level === level) || null;
}

/**
 * Get subscription tier details by level
 */
export function getSubscriptionTierByLevel(level: number): SubscriptionTier | null {
  return SUBSCRIPTION_TIERS.find(t => t.level === level) || null;
}

/**
 * Calculate CGT reward for tier upgrade
 * Returns the difference between new tier reward and previously received
 */
export function calculateCgtReward(newTier: number, previousCgtReceived: number): number {
  const tier = getTierByLevel(newTier);
  if (!tier) return 0;
  
  const newTotalEntitlement = tier.cgtReward;
  return Math.max(0, newTotalEntitlement - previousCgtReceived);
}

/**
 * Calculate free mints for tier upgrade
 * Returns the difference between new tier mints and what they already have
 */
export function calculateFreeMints(newTier: number, currentFreeMints: number): number {
  const tier = getTierByLevel(newTier);
  if (!tier) return 0;
  
  // For upgrades, add the difference
  return Math.max(0, tier.freeMints - currentFreeMints);
}

/**
 * Get effective tier (highest of donation tier or subscription tier perks)
 */
export function getEffectiveTier(
  donationTier: number,
  subscriptionTier: number,
  subscriptionActive: boolean
): number {
  if (!subscriptionActive) {
    return donationTier;
  }
  
  const subTier = getSubscriptionTierByLevel(subscriptionTier);
  const effectiveFromSub = subTier?.effectiveTier || 0;
  
  return Math.max(donationTier, effectiveFromSub);
}

/**
 * Format amount in cents to display string
 */
export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format basis points to percentage string
 */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}
