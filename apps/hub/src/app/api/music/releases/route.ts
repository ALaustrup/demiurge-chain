import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// GET /api/music/releases - Get all releases or filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const genre = searchParams.get('genre');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let url = `${QOR_AUTH_URL}/api/v1/music/releases?limit=${limit}&offset=${offset}`;
    if (artistId) url += `&artist_id=${artistId}`;
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
    if (featured) url += `&featured=true`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Backend unavailable — return honest empty state
    return NextResponse.json({
      releases: [],
      total: 0,
      message: 'Music service is not yet available. Releases will appear here once artists start minting.',
    });
  } catch (error: any) {
    console.error('Fetch releases error:', error);
    return NextResponse.json({
      releases: [],
      total: 0,
      error: 'Music service unavailable',
    });
  }
}

// POST /api/music/releases - Create a new release
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { title, genre, tracks } = body;
    if (!title || !genre || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Title, genre, and at least one track are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Music backend not available. Release was minted on-chain but not registered in the music index.' },
          { status: 503 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create release' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      releaseId: data.release_id || data.id,
      nftId: data.nft_id,
    });
  } catch (error: any) {
    console.error('Create release error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
