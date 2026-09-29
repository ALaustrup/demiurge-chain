import { NextRequest, NextResponse } from 'next/server';
import { 
  stripe, 
  cancelSubscription, 
  pauseSubscription, 
  resumeSubscription,
  createCustomerPortalSession 
} from '@/lib/stripe';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

/**
 * POST /api/donate/subscription
 * Manage subscription actions: pause, resume, cancel, portal
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tierLevel } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    // Get user's donor profile to find Stripe subscription ID
    const profileResponse = await fetch(`${QOR_AUTH_URL}/api/v1/donations/status`, {
      headers: { 'Authorization': authHeader },
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch donor profile' }, { status: 400 });
    }

    const profile = await profileResponse.json();
    const subscriptionId = profile.subscription_stripe_id;

    if (!subscriptionId && action !== 'portal') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    let result: any;

    switch (action) {
      case 'pause':
        result = await pauseSubscription(subscriptionId);
        if (result) {
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription paused',
            resumeDate: result.pause_collection?.resumes_at 
              ? new Date(result.pause_collection.resumes_at * 1000).toISOString()
              : null,
          });
        }
        break;

      case 'resume':
        result = await resumeSubscription(subscriptionId);
        if (result) {
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription resumed',
          });
        }
        break;

      case 'cancel':
        result = await cancelSubscription(subscriptionId);
        if (result) {
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription will cancel at end of billing period',
            cancelAt: result.cancel_at 
              ? new Date(result.cancel_at * 1000).toISOString()
              : null,
          });
        }
        break;

      case 'portal':
        // Get or create Stripe customer ID
        const customerId = profile.stripe_customer_id;
        if (!customerId) {
          return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donate`;
        const portalUrl = await createCustomerPortalSession(customerId, returnUrl);
        
        if (portalUrl) {
          return NextResponse.json({ 
            success: true, 
            url: portalUrl,
          });
        }
        break;

      case 'upgrade':
        if (!tierLevel || tierLevel < 1 || tierLevel > 5) {
          return NextResponse.json({ error: 'Invalid tier level' }, { status: 400 });
        }

        // Get the new price ID for the tier
        const priceId = process.env[`STRIPE_PRICE_SUB_TIER_${tierLevel}`];
        if (!priceId) {
          return NextResponse.json({ error: 'Price not configured for tier' }, { status: 400 });
        }

        // Update the subscription to the new price
        if (stripe && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = subscription as any;
          
          result = await stripe.subscriptions.update(subscriptionId, {
            items: [{
              id: subData.items?.data[0]?.id,
              price: priceId,
            }],
            metadata: {
              ...subData.metadata,
              subscription_tier: String(tierLevel),
            },
            proration_behavior: 'create_prorations',
          });

          if (result) {
            return NextResponse.json({ 
              success: true, 
              message: `Upgraded to tier ${tierLevel}`,
            });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  } catch (error: any) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
