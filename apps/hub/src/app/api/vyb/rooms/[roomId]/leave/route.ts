/**
 * VYB Room Leave API
 * POST /api/vyb/rooms/[roomId]/leave
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const qorId = req.headers.get('x-qor-id');
    if (!qorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await chatService.leaveRoom(roomId, qorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to leave room:', error);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
