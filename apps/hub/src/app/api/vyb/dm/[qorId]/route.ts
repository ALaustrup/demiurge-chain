/**
 * VYB DM History API
 * GET /api/vyb/dm/[qorId] - Get message history with specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qorId: string }> }
) {
  try {
    const { qorId } = await params;
    const myQorId = req.headers.get('x-qor-id');
    if (!myQorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const before = req.nextUrl.searchParams.get('before') || undefined;

    const messages = await chatService.getDMHistory(myQorId, qorId, limit, before);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] Failed to get DM history:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
