/**
 * User Badges API
 * 
 * GET /api/badges/[address]
 * Get all badges for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBadges } from '@/lib/badges';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address required' },
        { status: 400 }
      );
    }

    const collection = await getUserBadges(address);

    return NextResponse.json({
      success: true,
      collection,
    });

  } catch (error: any) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
