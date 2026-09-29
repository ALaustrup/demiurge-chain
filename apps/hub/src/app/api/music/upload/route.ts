import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.QOR_AUTH_URL || 'http://localhost:8080';

/**
 * POST /api/music/upload
 * Upload a new music track
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, file_url' },
        { status: 400 }
      );
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/tracks/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Music API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /music/upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload track' },
      { status: 500 }
    );
  }
}
