import { NextRequest, NextResponse } from 'next/server';
import { qorAuth } from '@demiurge/qor-sdk';

// In-memory store for now (in production, use a database)
// This would typically connect to PostgreSQL via QOR Auth backend
const notificationRequests: Map<string, {
  qorId: string;
  email?: string;
  phone?: string;
  feature: string;
  createdAt: Date;
  rewardClaimed: boolean;
}> = new Map();

/**
 * POST /api/notify-me
 * Register for feature notification and earn CGT reward
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, phone, feature } = body;

    if (!feature) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Either email or phone is required' }, { status: 400 });
    }

    // Get user profile from token
    let qorId = 'unknown';
    try {
      // Extract token and get user info
      const token = authHeader.replace('Bearer ', '');
      // In a real implementation, decode the JWT or call the profile endpoint
      // For now, we'll use a placeholder
      qorId = body.qorId || 'user';
    } catch {
      // Continue with unknown user
    }

    const requestId = `${qorId}-${feature}`;
    const existing = notificationRequests.get(requestId);

    // Calculate reward
    let cgtReward = 0;
    let secretBadgeEligible = false;

    if (!existing) {
      // First time registration for this feature
      if (email && phone) {
        // Both provided - max reward + secret badge
        cgtReward = 100;
        secretBadgeEligible = true;
      } else if (email || phone) {
        // One provided - partial reward
        cgtReward = 50;
      }
    } else if (existing && !existing.rewardClaimed) {
      // User adding missing info
      if (email && !existing.email) {
        cgtReward = 25;
      }
      if (phone && !existing.phone) {
        cgtReward += 25;
      }
      // Check if now eligible for secret badge
      if ((email || existing.email) && (phone || existing.phone)) {
        secretBadgeEligible = true;
      }
    }

    // Store or update the request
    notificationRequests.set(requestId, {
      qorId,
      email: email || existing?.email,
      phone: phone || existing?.phone,
      feature,
      createdAt: existing?.createdAt || new Date(),
      rewardClaimed: true,
    });

    // TODO: Add proper logging service for admin tracking

    return NextResponse.json({
      success: true,
      message: 'You will be notified when this feature launches!',
      reward: {
        cgt: cgtReward,
        secretBadge: secretBadgeEligible,
        // Don't reveal the badge to the user - it's a secret!
        hint: secretBadgeEligible ? 'Something special has been added to your account...' : undefined,
      },
      // Return what info was stored
      stored: {
        email: !!(email || existing?.email),
        phone: !!(phone || existing?.phone),
      }
    });
  } catch (error: any) {
    console.error('[Notify-Me] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register notification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notify-me
 * Check if user is already registered for a feature
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');
    const qorId = searchParams.get('qorId') || 'user';

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter is required' }, { status: 400 });
    }

    const requestId = `${qorId}-${feature}`;
    const existing = notificationRequests.get(requestId);

    return NextResponse.json({
      registered: !!existing,
      hasEmail: !!existing?.email,
      hasPhone: !!existing?.phone,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check notification status' },
      { status: 500 }
    );
  }
}
