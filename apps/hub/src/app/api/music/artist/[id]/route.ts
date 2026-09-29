import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// GET /api/music/artist/[id] - Get artist profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ artist: data });
  } catch (error: any) {
    console.error('Fetch artist error:', error);
    return NextResponse.json(
      { error: 'Music service unavailable' },
      { status: 503 }
    );
  }
}
