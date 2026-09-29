import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.QOR_AUTH_URL || 'http://localhost:8080';

/**
 * GET /api/music/playlists
 * Get all public playlists
 */
export async function GET() {
  try {
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/playlists`, {
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
    console.error('[API /music/playlists] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/music/playlists
 * Create a new playlist
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/playlists/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Music API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /music/playlists] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
