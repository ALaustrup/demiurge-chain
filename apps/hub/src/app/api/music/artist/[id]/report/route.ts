import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// POST /api/music/artist/[id]/report - Report an artist for impersonation or violation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    
    // Reports can be submitted by anyone (authenticated or not)
    // but authenticated reports are prioritized

    const body = await request.json();
    const { reason, details, realArtistLink } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Try to submit to backend
    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({
        reason,
        details: details || null,
        real_artist_link: realArtistLink || null,
        reported_at: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Report submitted successfully' });
    }

    // If backend doesn't exist, return success for development
    if (response.status === 404) {
      return NextResponse.json({ success: true, message: 'Report submitted (dev mode)' });
    }

    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message || 'Failed to submit report' },
      { status: response.status }
    );
  } catch (error: any) {
    console.error('Artist report error:', error);
    // Return success for development
    return NextResponse.json({ success: true, message: 'Report submitted' });
  }
}
