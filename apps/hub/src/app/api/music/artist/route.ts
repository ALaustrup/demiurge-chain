import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// POST /api/music/artist/register - Register as a music artist
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { artistName, primaryGenre, bio, socialLinks } = body;

    if (!artistName || !primaryGenre) {
      return NextResponse.json(
        { error: 'Artist name and primary genre are required' },
        { status: 400 }
      );
    }

    // Validate artist name length
    if (artistName.length < 2 || artistName.length > 50) {
      return NextResponse.json(
        { error: 'Artist name must be 2-50 characters' },
        { status: 400 }
      );
    }

    // Call qor-auth backend to register artist
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        artist_name: artistName,
        primary_genre: primaryGenre,
        bio: bio || null,
        social_links: socialLinks || {},
      }),
    });

    if (!response.ok) {
      // If backend doesn't exist yet, simulate success for development
      if (response.status === 404) {
        // Generate mock artist ID for development
        const mockArtistId = `artist_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        return NextResponse.json({
          success: true,
          artistId: mockArtistId,
          message: 'Artist profile created successfully (dev mode)',
        });
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to register artist' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      artistId: data.artist_id || data.id,
      badgeNftId: data.badge_nft_id,
      message: 'Artist profile created successfully',
    });
  } catch (error: any) {
    console.error('Artist registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/music/artist - Get current user's artist profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/me`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ artist: null });
      }
      return NextResponse.json(
        { error: 'Failed to fetch artist profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ artist: data });
  } catch (error: any) {
    console.error('Fetch artist error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
