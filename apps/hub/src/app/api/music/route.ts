import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.QOR_AUTH_URL || 'http://localhost:8080';

/**
 * GET /api/music
 * Proxy to get music tracks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    let url = `${QOR_AUTH_URL}/api/v1/music/tracks?limit=${limit}&offset=${offset}`;
    if (genre) {
      url += `&genre=${encodeURIComponent(genre)}`;
    }

    const response = await fetch(url, {
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
    console.error('[API /music] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
