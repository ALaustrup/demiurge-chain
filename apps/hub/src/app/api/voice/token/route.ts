/**
 * Ephemeral Token API Route
 * 
 * Generates short-lived tokens for client-side Grok Voice API connections.
 * This keeps the XAI_API_KEY secure on the server.
 */

import { NextRequest, NextResponse } from 'next/server';

const SESSION_REQUEST_URL = 'https://api.x.ai/v1/realtime/client_secrets';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Voice API not configured' },
        { status: 503 }
      );
    }

    // Parse request body for optional expiration time
    let expiresAfterSeconds = 300; // Default 5 minutes
    try {
      const body = await request.json();
      if (body.expires_after_seconds && typeof body.expires_after_seconds === 'number') {
        // Cap at 10 minutes for security
        expiresAfterSeconds = Math.min(body.expires_after_seconds, 600);
      }
    } catch {
      // Use default if no body provided
    }

    // Request ephemeral token from xAI
    const response = await fetch(SESSION_REQUEST_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: expiresAfterSeconds },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice Token] xAI API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate voice token' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the ephemeral token to the client
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Voice Token] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate voice token' },
      { status: 500 }
    );
  }
}

// Also support GET for simple token retrieval
export async function GET(request: NextRequest) {
  return POST(request);
}
