/**
 * Donor Perks Service
 * 
 * Utility functions for checking and consuming donor perks like free mints.
 */

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

export interface DonorPerks {
  freeMints: number;
  stakingBonusBps: number;
  xpRateBonusBps: number;
  energyDiscountBps: number;
  chatPrivileges: string[];
  donorTier: number;
  subscriptionTier: number;
  isSubscriber: boolean;
}

/**
 * Get donor perks for a user
 * 
 * @param authHeader Authorization header from request
 * @returns Donor perks or null if not a donor
 */
export async function getDonorPerks(authHeader: string | null): Promise<DonorPerks | null> {
  if (!authHeader) return null;

  try {
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/donations/status`, {
      headers: { 'Authorization': authHeader },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    return {
      freeMints: data.free_mints_remaining || 0,
      stakingBonusBps: data.staking_bonus_bps || 0,
      xpRateBonusBps: data.xp_rate_bonus_bps || 0,
      energyDiscountBps: data.gas_discount_bps || 0,
      chatPrivileges: data.chat_privileges || [],
      donorTier: data.current_tier || 0,
      subscriptionTier: data.subscription_tier || 0,
      isSubscriber: data.subscription_status === 'active',
    };
  } catch (error) {
    console.error('[DonorPerks] Failed to fetch perks:', error);
    return null;
  }
}

/**
 * Check if user has free mints available
 * 
 * @param authHeader Authorization header from request
 * @returns Number of free mints available
 */
export async function getFreeMints(authHeader: string | null): Promise<number> {
  const perks = await getDonorPerks(authHeader);
  return perks?.freeMints || 0;
}

/**
 * Consume a free mint for a user
 * 
 * @param userId User ID
 * @param webhookSecret Internal webhook secret for auth
 * @returns Success status and remaining mints
 */
export async function consumeFreeMint(
  userId: string,
  webhookSecret: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/donations/consume-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        remaining: 0,
        error: error.message || 'Failed to consume free mint',
      };
    }

    const data = await response.json();
    return {
      success: true,
      remaining: data.remaining || 0,
    };
  } catch (error: any) {
    console.error('[DonorPerks] Failed to consume free mint:', error);
    return {
      success: false,
      remaining: 0,
      error: error.message || 'Internal error',
    };
  }
}

/**
 * Check if a mint should be free for a donor
 * If so, consume one free mint
 * 
 * @param authHeader Authorization header
 * @param userId User ID
 * @returns Object indicating if mint is free and any error
 */
export async function checkAndConsumeFreeMint(
  authHeader: string | null,
  userId: string
): Promise<{ isFree: boolean; error?: string }> {
  const freeMints = await getFreeMints(authHeader);
  
  if (freeMints <= 0) {
    return { isFree: false };
  }

  // Try to consume a free mint
  const webhookSecret = process.env.WEBHOOK_INTERNAL_SECRET || '';
  const result = await consumeFreeMint(userId, webhookSecret);

  if (result.success) {
    return { isFree: true };
  }

  return { isFree: false, error: result.error };
}

/**
 * Calculate energy discount for a donor
 * 
 * @param baseFee Base transaction fee
 * @param energyDiscountBps Energy discount in basis points (1000 = 10%)
 * @returns Discounted fee
 */
export function applyEnergyDiscount(baseFee: number, energyDiscountBps: number): number {
  if (energyDiscountBps <= 0) return baseFee;
  const discount = baseFee * (energyDiscountBps / 10000);
  return Math.max(0, baseFee - discount);
}

/**
 * Apply XP bonus to a reward amount
 * 
 * @param baseAmount Base XP/reward amount
 * @param xpRateBonusBps XP rate bonus in basis points (500 = 5%)
 * @returns Boosted amount
 */
export function applyXpBonus(baseAmount: number, xpRateBonusBps: number): number {
  if (xpRateBonusBps <= 0) return baseAmount;
  const bonus = baseAmount * (xpRateBonusBps / 10000);
  return baseAmount + bonus;
}
