import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// GET /api/music/release/[id] - Get release by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/release/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ release: data });
    }

    return NextResponse.json(
      { error: 'Release not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Fetch release error:', error);
    return NextResponse.json(
      { error: 'Music service unavailable' },
      { status: 503 }
    );
  }
}

// POST /api/music/release/[id]/like - Like a release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/release/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
    });

    if (!response.ok && response.status !== 404) {
      return NextResponse.json(
        { error: 'Failed to like release' },
        { status: response.status }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Like service not available' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Like release error:', error);
    return NextResponse.json(
      { error: 'Music service unavailable' },
      { status: 503 }
    );
  }
}
