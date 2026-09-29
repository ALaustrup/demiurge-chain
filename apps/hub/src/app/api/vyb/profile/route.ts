/**
 * VYB Profile API
 * POST /api/vyb/profile - Create/update own profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const qorId = req.headers.get('x-qor-id');
    if (!qorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      bio,
      avatar_url,
      banner_url,
      music_url,
      theme_json,
      sex,
      age,
      location,
      social_links,
    } = body;

    const profile = await execute(`
      INSERT INTO vyb_profiles (qor_id, display_name, bio, avatar_url, banner_url, music_url, theme_json, sex, age, location, social_links, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (qor_id) DO UPDATE SET
        display_name = COALESCE($2, vyb_profiles.display_name),
        bio = COALESCE($3, vyb_profiles.bio),
        avatar_url = COALESCE($4, vyb_profiles.avatar_url),
        banner_url = COALESCE($5, vyb_profiles.banner_url),
        music_url = COALESCE($6, vyb_profiles.music_url),
        theme_json = COALESCE($7, vyb_profiles.theme_json),
        sex = COALESCE($8, vyb_profiles.sex),
        age = COALESCE($9, vyb_profiles.age),
        location = COALESCE($10, vyb_profiles.location),
        social_links = COALESCE($11, vyb_profiles.social_links),
        updated_at = NOW()
      RETURNING *
    `, [
      qorId,
      display_name || null,
      bio || null,
      avatar_url || null,
      banner_url || null,
      music_url || null,
      theme_json ? JSON.stringify(theme_json) : null,
      sex || null,
      age || null,
      location || null,
      social_links ? JSON.stringify(social_links) : null,
    ]);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API] Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
