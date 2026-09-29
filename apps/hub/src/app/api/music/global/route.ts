import { NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.QOR_AUTH_URL || 'http://localhost:8080';

/**
 * GET /api/music/global
 * Get the global Demiurge Radio playlist
 */
export async function GET() {
  try {
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/playlists/global`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Music API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /music/global] Error:', error);
    // Return empty array as fallback
    return NextResponse.json([]);
  }
}
