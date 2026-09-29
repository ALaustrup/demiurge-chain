/**
 * Badge Minting API
 * 
 * POST /api/badges/mint
 * Mints official DRC-369 badges for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { mintOfficialBadge, getUserBadges } from '@/lib/badges';
import type { OfficialBadgeType, BadgeMintRequest } from '@/lib/badges/types';

// Allowed badge types for public minting (others require special conditions)
const PUBLIC_MINTABLE_BADGES: OfficialBadgeType[] = [
  'MUSIC_ARTIST',
  'GAME_DEVELOPER',
];

// Badge types that require verification
const VERIFIED_MINT_BADGES: OfficialBadgeType[] = [
  'DONOR_SUPPORTER',
  'DONOR_CHAMPION',
  'DONOR_GUARDIAN',
  'DONOR_ARCHITECT',
  'DONOR_GODSENT',
  'VALIDATOR',
  'EARLY_ADOPTER',
  'GENESIS_MEMBER',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipientAddress, 
      recipientQorId, 
      badgeType, 
      context,
      verificationToken, // Required for verified badges
    } = body as BadgeMintRequest & { verificationToken?: string };

    // Validate required fields
    if (!recipientAddress || !recipientQorId || !badgeType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if badge type exists
    const validBadgeTypes: OfficialBadgeType[] = [
      ...PUBLIC_MINTABLE_BADGES,
      ...VERIFIED_MINT_BADGES,
    ];
    
    if (!validBadgeTypes.includes(badgeType as OfficialBadgeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid badge type' },
        { status: 400 }
      );
    }

    // Check if user already has this badge
    const existingBadges = await getUserBadges(recipientAddress);
    const alreadyHas = existingBadges.badges.some(b => b.type === badgeType);
    
    if (alreadyHas) {
      return NextResponse.json(
        { success: false, error: 'User already has this badge' },
        { status: 409 }
      );
    }

    // Verify authorization for protected badges
    if (VERIFIED_MINT_BADGES.includes(badgeType as OfficialBadgeType)) {
      // Donor badges require donation verification
      if (badgeType.startsWith('DONOR_')) {
        if (!context?.donationId) {
          return NextResponse.json(
            { success: false, error: 'Donor badge requires donation verification' },
            { status: 403 }
          );
        }
        // In production, verify the donation exists and matches the tier
        // const donation = await verifyDonation(context.donationId, recipientQorId);
      }
      
      // Validator badge requires active validator status
      if (badgeType === 'VALIDATOR') {
        // In production, verify the address is an active validator
        // const isValidator = await verifyValidator(recipientAddress);
      }
      
      // Early adopter and genesis badges are admin-only
      if (badgeType === 'EARLY_ADOPTER' || badgeType === 'GENESIS_MEMBER') {
        if (!verificationToken || verificationToken !== process.env.ADMIN_BADGE_SECRET) {
          return NextResponse.json(
            { success: false, error: 'Admin authorization required' },
            { status: 403 }
          );
        }
      }
    }

    // Mint the badge
    const result = await mintOfficialBadge({
      recipientAddress,
      recipientQorId,
      badgeType: badgeType as OfficialBadgeType,
      context,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokenId: result.tokenId,
      txHash: result.txHash,
      badge: {
        type: badgeType,
        name: result.metadata?.name,
        imageUrl: result.metadata?.image,
      },
    });

  } catch (error: any) {
    console.error('Badge minting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/badges/mint?address=...
 * Check what badges a user is eligible to mint
 */
export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address required' },
        { status: 400 }
      );
    }

    // Get user's current badges
    const userBadges = await getUserBadges(address);
    const ownedTypes = userBadges.badges.map(b => b.type);

    // Check eligibility for each public badge
    const eligibleBadges = PUBLIC_MINTABLE_BADGES
      .filter(type => !ownedTypes.includes(type))
      .map(type => ({
        type,
        eligible: true,
        reason: 'Complete signup process to claim',
      }));

    return NextResponse.json({
      success: true,
      ownedBadges: userBadges.badges.map(b => ({
        type: b.type,
        name: b.name,
        tokenId: b.tokenId,
      })),
      eligibleBadges,
    });

  } catch (error: any) {
    console.error('Badge eligibility check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
