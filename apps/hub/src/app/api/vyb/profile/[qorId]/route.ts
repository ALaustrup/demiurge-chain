/**
 * VYB Profile Detail API
 * GET /api/vyb/profile/[qorId] - Get user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qorId: string }> }
) {
  try {
    const { qorId } = await params;
    const profile = await queryOne(`
      SELECT * FROM vyb_profiles WHERE qor_id = $1
    `, [qorId]);

    if (!profile) {
      // Return a default profile shell
      return NextResponse.json({
        profile: {
          qor_id: qorId,
          display_name: qorId.split('#')[0],
          bio: null,
          avatar_url: null,
          banner_url: null,
          music_url: null,
          theme_json: {},
          sex: null,
          age: null,
          location: null,
          social_links: {},
        }
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API] Failed to get profile:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
