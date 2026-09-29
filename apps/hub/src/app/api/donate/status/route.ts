import { NextRequest, NextResponse } from 'next/server';
import { 
  getTierByLevel, 
  getSubscriptionTierByLevel,
  getEffectiveTier,
  DONATION_TIERS,
  formatAmount,
  formatBps 
} from '@/lib/donation-tiers';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

/**
 * GET /api/donate/status
 * Returns the current user's donation status, tier, and active perks
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get donor profile from QOR Auth
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/donations/status`, {
      headers: { 'Authorization': authHeader },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No donor profile yet - return default state
        return NextResponse.json({
          isDonor: false,
          lifetimeAmount: '$0.00',
          lifetimeCents: 0,
          currentTier: null,
          subscription: null,
          effectiveTier: null,
          perks: {
            stakingBonus: '0%',
            xpBonus: '0%',
            energyDiscount: '0%',
            freeMints: 0,
            chatPrivileges: [],
          },
          badge: null,
          nextTier: DONATION_TIERS[0] ? {
            name: DONATION_TIERS[0].name,
            minAmount: formatAmount(DONATION_TIERS[0].minAmount),
            amountNeeded: formatAmount(DONATION_TIERS[0].minAmount),
          } : null,
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch donation status' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Calculate effective tier
    const effectiveTierLevel = getEffectiveTier(
      data.current_tier || 0,
      data.subscription_tier || 0,
      data.subscription_status === 'active'
    );

    const currentTier = getTierByLevel(data.current_tier || 0);
    const effectiveTier = getTierByLevel(effectiveTierLevel);
    const subscriptionTier = data.subscription_tier 
      ? getSubscriptionTierByLevel(data.subscription_tier) 
      : null;

    // Find next tier
    let nextTier = null;
    if (data.current_tier < 5) {
      const next = DONATION_TIERS.find(t => t.level === (data.current_tier || 0) + 1);
      if (next) {
        const amountNeeded = next.minAmount - (data.lifetime_cents || 0);
        nextTier = {
          level: next.level,
          name: next.name,
          minAmount: formatAmount(next.minAmount),
          amountNeeded: formatAmount(Math.max(0, amountNeeded)),
          progress: Math.min(100, ((data.lifetime_cents || 0) / next.minAmount) * 100),
        };
      }
    }

    return NextResponse.json({
      isDonor: (data.lifetime_cents || 0) > 0 || data.subscription_status === 'active',
      
      // One-time donation info
      lifetimeAmount: formatAmount(data.lifetime_cents || 0),
      lifetimeCents: data.lifetime_cents || 0,
      currentTier: currentTier ? {
        level: currentTier.level,
        name: currentTier.name,
        color: currentTier.badgeColor,
      } : null,
      totalCgtReceived: data.total_cgt_received || 0,
      
      // Subscription info
      subscription: data.subscription_status !== 'none' && subscriptionTier ? {
        status: data.subscription_status,
        tier: {
          level: subscriptionTier.level,
          name: subscriptionTier.name,
        },
        effectiveTierName: getTierByLevel(subscriptionTier.effectiveTier)?.name,
        currentPeriodEnd: data.subscription_current_period_end,
        cgtPerCycle: subscriptionTier.cgtPerCycle,
        subscriptionCgtReceived: data.subscription_cgt_received || 0,
      } : null,
      
      // Effective tier (highest of donation or subscription)
      effectiveTier: effectiveTier ? {
        level: effectiveTier.level,
        name: effectiveTier.name,
        color: effectiveTier.badgeColor,
        source: data.subscription_status === 'active' && 
                (getSubscriptionTierByLevel(data.subscription_tier)?.effectiveTier ?? 0) > (data.current_tier || 0)
          ? 'subscription'
          : 'donation',
      } : null,
      
      // Active perks
      perks: {
        stakingBonus: formatBps(data.staking_bonus_bps || 0),
        stakingBonusBps: data.staking_bonus_bps || 0,
        xpBonus: formatBps(data.xp_rate_bonus_bps || 0),
        xpBonusBps: data.xp_rate_bonus_bps || 0,
        energyDiscount: formatBps(data.gas_discount_bps || 0),
        energyDiscountBps: data.gas_discount_bps || 0,
        freeMints: data.free_mints_remaining || 0,
        chatPrivileges: data.chat_privileges || [],
      },
      
      // Badge NFT
      badge: data.badge_nft_uuid ? {
        uuid: data.badge_nft_uuid,
        mintedAt: data.badge_minted_at,
        image: effectiveTier?.badgeImage,
      } : null,
      
      // Progress to next tier
      nextTier,
    });
  } catch (error: any) {
    console.error('Get donation status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
